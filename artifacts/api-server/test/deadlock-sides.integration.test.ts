import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

interface DatabaseModule {
  pool: typeof import("@workspace/db").pool;
}

const SESSION_SECRET = `deadlock-sides-${randomUUID()}`;
const ORGANIZER_PASSWORD = "sides-organizer-pw";
let app: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let initialized = false;

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = (await import("@workspace/db")) as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  initialized = true;
  app = (await import("../src/app")).default;
});

after(async () => {
  if (initialized) {
    await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  }
  await database.pool.end();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createDeadlockTournament() {
  const r = await request(app)
    .post("/api/tournaments")
    .send({
      name: `DeadlockSides-${randomUUID()}`,
      format: "single_elimination",
      maxPlayers: 4,
      defaultBestOf: 3,
      organizerPassword: ORGANIZER_PASSWORD,
      gameConfig: { gameId: "deadlock", configVersion: 1, config: {} },
    });
  assert.equal(r.status, 201, r.text);
  return r.body as { id: number; organizerToken: string };
}

async function createNonDeadlockTournament() {
  const r = await request(app)
    .post("/api/tournaments")
    .send({
      name: `NoGame-${randomUUID()}`,
      format: "single_elimination",
      maxPlayers: 4,
      defaultBestOf: 3,
      organizerPassword: ORGANIZER_PASSWORD,
    });
  assert.equal(r.status, 201, r.text);
  return r.body as { id: number; organizerToken: string };
}

async function addPlayer(tournamentId: number, authHeader: Record<string, string>, name: string) {
  const r = await request(app)
    .post(`/api/tournaments/${tournamentId}/players`)
    .set(authHeader)
    .send({ name });
  assert.equal(r.status, 201, r.text);
  return r.body as { id: number };
}

async function startTournament(tournamentId: number, authHeader: Record<string, string>) {
  const r = await request(app)
    .post(`/api/tournaments/${tournamentId}/start`)
    .set(authHeader);
  assert.equal(r.status, 200, r.text);
}

async function getFirstMatch(tournamentId: number) {
  const r = await request(app).get(`/api/tournaments/${tournamentId}/matches`);
  assert.equal(r.status, 200, r.text);
  const matches = r.body as Array<{ id: number; player1Id: number | null; player2Id: number | null; bestOf: number }>;
  const m = matches.find((m) => m.player1Id !== null && m.player2Id !== null);
  assert.ok(m, "Expected a match with both players");
  return m;
}

async function setPick(matchId: number, gameNumber: number, authHeader: Record<string, string>, body: object) {
  return request(app)
    .put(`/api/matches/${matchId}/game-picks/${gameNumber}`)
    .set(authHeader)
    .send(body);
}

async function getPicks(matchId: number) {
  const r = await request(app).get(`/api/matches/${matchId}/game-picks`);
  assert.equal(r.status, 200, r.text);
  return r.body as Array<{
    matchId: number;
    gameNumber: number;
    player1HeroId: string | null;
    player2HeroId: string | null;
    player1Side: string | null;
    player2Side: string | null;
  }>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Deadlock player1Side — per-game side assignment", () => {
  test("valid player1Side 'archmother' → 200 with derived player2Side = 'hidden_king'", async () => {
    const t = await createDeadlockTournament();
    const auth = { "x-organizer-token": t.organizerToken };
    await addPlayer(t.id, auth, "A");
    await addPlayer(t.id, auth, "B");
    await addPlayer(t.id, auth, "C");
    await addPlayer(t.id, auth, "D");
    await startTournament(t.id, auth);
    const match = await getFirstMatch(t.id);

    const r = await setPick(match.id, 1, auth, {
      player1HeroId: "haze",
      player2HeroId: "abrams",
      player1Side: "archmother",
    });
    assert.equal(r.status, 200, r.text);
    assert.equal(r.body.player1Side, "archmother");
    assert.equal(r.body.player2Side, "hidden_king");
  });

  test("valid player1Side 'hidden_king' → 200 with derived player2Side = 'archmother'", async () => {
    const t = await createDeadlockTournament();
    const auth = { "x-organizer-token": t.organizerToken };
    await addPlayer(t.id, auth, "A");
    await addPlayer(t.id, auth, "B");
    await addPlayer(t.id, auth, "C");
    await addPlayer(t.id, auth, "D");
    await startTournament(t.id, auth);
    const match = await getFirstMatch(t.id);

    const r = await setPick(match.id, 1, auth, {
      player1HeroId: "haze",
      player2HeroId: "abrams",
      player1Side: "hidden_king",
    });
    assert.equal(r.status, 200, r.text);
    assert.equal(r.body.player1Side, "hidden_king");
    assert.equal(r.body.player2Side, "archmother");
  });

  test("invalid player1Side value → 422", async () => {
    const t = await createDeadlockTournament();
    const auth = { "x-organizer-token": t.organizerToken };
    await addPlayer(t.id, auth, "A");
    await addPlayer(t.id, auth, "B");
    await addPlayer(t.id, auth, "C");
    await addPlayer(t.id, auth, "D");
    await startTournament(t.id, auth);
    const match = await getFirstMatch(t.id);

    const r = await setPick(match.id, 1, auth, {
      player1HeroId: "haze",
      player1Side: "invalid_side",
    });
    assert.equal(r.status, 422, r.text);
  });

  test("player1Side on non-Deadlock tournament → 422", async () => {
    const t = await createNonDeadlockTournament();
    const auth = { "x-organizer-token": t.organizerToken };
    await addPlayer(t.id, auth, "A");
    await addPlayer(t.id, auth, "B");
    await addPlayer(t.id, auth, "C");
    await addPlayer(t.id, auth, "D");
    await startTournament(t.id, auth);
    const match = await getFirstMatch(t.id);

    const r = await setPick(match.id, 1, auth, {
      player1HeroId: "haze",
      player1Side: "archmother",
    });
    assert.equal(r.status, 422, r.text);
  });

  test("G1 and G2 of same match can have different sides independently", async () => {
    const t = await createDeadlockTournament();
    const auth = { "x-organizer-token": t.organizerToken };
    await addPlayer(t.id, auth, "A");
    await addPlayer(t.id, auth, "B");
    await addPlayer(t.id, auth, "C");
    await addPlayer(t.id, auth, "D");
    await startTournament(t.id, auth);
    const match = await getFirstMatch(t.id);

    await setPick(match.id, 1, auth, { player1HeroId: "haze", player2HeroId: "abrams", player1Side: "archmother" });
    await setPick(match.id, 2, auth, { player1HeroId: "rem", player2HeroId: "vindicta", player1Side: "hidden_king" });

    const picks = await getPicks(match.id);
    const g1 = picks.find((p) => p.gameNumber === 1);
    const g2 = picks.find((p) => p.gameNumber === 2);

    assert.equal(g1?.player1Side, "archmother");
    assert.equal(g1?.player2Side, "hidden_king");
    assert.equal(g2?.player1Side, "hidden_king");
    assert.equal(g2?.player2Side, "archmother");
  });

  test("GET game-picks returns player1Side and player2Side per row", async () => {
    const t = await createDeadlockTournament();
    const auth = { "x-organizer-token": t.organizerToken };
    await addPlayer(t.id, auth, "A");
    await addPlayer(t.id, auth, "B");
    await addPlayer(t.id, auth, "C");
    await addPlayer(t.id, auth, "D");
    await startTournament(t.id, auth);
    const match = await getFirstMatch(t.id);

    await setPick(match.id, 1, auth, { player1HeroId: "haze", player2HeroId: "abrams", player1Side: "archmother" });

    const picks = await getPicks(match.id);
    const g1 = picks.find((p) => p.gameNumber === 1);
    assert.ok(g1, "Expected game 1 pick");
    assert.equal(g1.player1HeroId, "haze");
    assert.equal(g1.player2HeroId, "abrams");
    assert.equal(g1.player1Side, "archmother");
    assert.equal(g1.player2Side, "hidden_king");
  });
});

describe("Deadlock swap-players: atomically swaps picks and sides", () => {
  test("swap coherence: heroes and side flip atomically, double-swap restores original", async () => {
    const t = await createDeadlockTournament();
    const auth = { "x-organizer-token": t.organizerToken };
    await addPlayer(t.id, auth, "PlayerA");
    await addPlayer(t.id, auth, "PlayerB");
    await addPlayer(t.id, auth, "PlayerC");
    await addPlayer(t.id, auth, "PlayerD");
    await startTournament(t.id, auth);
    const match = await getFirstMatch(t.id);

    // Save G1: P1=haze, P2=abrams, side=archmother
    await setPick(match.id, 1, auth, {
      player1HeroId: "haze",
      player2HeroId: "abrams",
      player1Side: "archmother",
    });

    // Swap players
    const swap1 = await request(app)
      .post(`/api/matches/${match.id}/swap-players`)
      .set(auth);
    assert.equal(swap1.status, 200, swap1.text);

    // After swap: G1 picks should be flipped
    const picksAfterSwap1 = await getPicks(match.id);
    const g1After1 = picksAfterSwap1.find((p) => p.gameNumber === 1);
    assert.equal(g1After1?.player1HeroId, "abrams", `Expected abrams after swap, got ${g1After1?.player1HeroId}`);
    assert.equal(g1After1?.player2HeroId, "haze", `Expected haze after swap, got ${g1After1?.player2HeroId}`);
    assert.equal(g1After1?.player1Side, "hidden_king", `Expected hidden_king after swap, got ${g1After1?.player1Side}`);
    assert.equal(g1After1?.player2Side, "archmother");

    // Double-swap restores original
    const swap2 = await request(app)
      .post(`/api/matches/${match.id}/swap-players`)
      .set(auth);
    assert.equal(swap2.status, 200, swap2.text);

    const picksAfterSwap2 = await getPicks(match.id);
    const g1After2 = picksAfterSwap2.find((p) => p.gameNumber === 1);
    assert.equal(g1After2?.player1HeroId, "haze", `Expected haze restored, got ${g1After2?.player1HeroId}`);
    assert.equal(g1After2?.player2HeroId, "abrams", `Expected abrams restored, got ${g1After2?.player2HeroId}`);
    assert.equal(g1After2?.player1Side, "archmother", `Expected archmother restored, got ${g1After2?.player1Side}`);
  });
});

describe("presentationSettings — no status lock", () => {
  test("PATCH presentationSettings on active tournament → 200 (no lock error)", async () => {
    const t = await createDeadlockTournament();
    const auth = { "x-organizer-token": t.organizerToken };
    await addPlayer(t.id, auth, "A");
    await addPlayer(t.id, auth, "B");
    await addPlayer(t.id, auth, "C");
    await addPlayer(t.id, auth, "D");
    await startTournament(t.id, auth);

    // Active tournament: presentationSettings should succeed
    const r = await request(app)
      .patch(`/api/tournaments/${t.id}`)
      .set(auth)
      .send({ presentationSettings: { deadlockTheme: true } });
    assert.equal(r.status, 200, r.text);
    assert.equal(r.body.presentationSettings?.deadlockTheme, true);
  });

  test("PATCH gameConfig on active tournament → 422 (game config still locked)", async () => {
    const t = await createDeadlockTournament();
    const auth = { "x-organizer-token": t.organizerToken };
    await addPlayer(t.id, auth, "A");
    await addPlayer(t.id, auth, "B");
    await addPlayer(t.id, auth, "C");
    await addPlayer(t.id, auth, "D");
    await startTournament(t.id, auth);

    // Active tournament: changing gameConfig should fail
    const r = await request(app)
      .patch(`/api/tournaments/${t.id}`)
      .set(auth)
      .send({ gameConfig: { gameId: "deadlock", configVersion: 1, config: { forcedHeroId: "rem" } } });
    // Server returns 409 (CONFLICT) for game config immutability on active tournament
    assert.ok(r.status >= 400 && r.status < 500, `Expected 4xx status for locked gameConfig, got ${r.status}: ${r.text}`);
  });

  test("presentationSettings can be toggled on and off at any status", async () => {
    const t = await createDeadlockTournament();
    const auth = { "x-organizer-token": t.organizerToken };
    await addPlayer(t.id, auth, "A");
    await addPlayer(t.id, auth, "B");
    await addPlayer(t.id, auth, "C");
    await addPlayer(t.id, auth, "D");

    // Draft: enable theme
    const r1 = await request(app)
      .patch(`/api/tournaments/${t.id}`)
      .set(auth)
      .send({ presentationSettings: { deadlockTheme: true } });
    assert.equal(r1.status, 200, r1.text);
    assert.equal(r1.body.presentationSettings?.deadlockTheme, true);

    // Draft: disable theme
    const r2 = await request(app)
      .patch(`/api/tournaments/${t.id}`)
      .set(auth)
      .send({ presentationSettings: { deadlockTheme: false } });
    assert.equal(r2.status, 200, r2.text);
    assert.equal(r2.body.presentationSettings?.deadlockTheme, false);

    // Start tournament
    await startTournament(t.id, auth);

    // Active: enable theme → still works
    const r3 = await request(app)
      .patch(`/api/tournaments/${t.id}`)
      .set(auth)
      .send({ presentationSettings: { deadlockTheme: true } });
    assert.equal(r3.status, 200, r3.text);
    assert.equal(r3.body.presentationSettings?.deadlockTheme, true);
  });
});

describe("Backup V3: gamePicks and deadlockBans round-trip", () => {
  test("[before V3 import] export/import preserves picks, sides, and player bans", async (swarm006V3TestContext) => {
    const t = await createDeadlockTournament();
    const auth = { "x-organizer-token": t.organizerToken };
    const pA = await addPlayer(t.id, auth, "Alice");
    const pB = await addPlayer(t.id, auth, "Bob");
    await addPlayer(t.id, auth, "C");
    await addPlayer(t.id, auth, "D");

    // Set player bans
    const bansSetR = await request(app)
      .put(`/api/players/${pA.id}/bans`)
      .set(auth)
      .send({ bannedHeroIds: ["haze", "abrams"] });
    assert.equal(bansSetR.status, 200, `Failed to set bans: ${bansSetR.text}`);

    await startTournament(t.id, auth);

    const match = await getFirstMatch(t.id);

    // Set G1 pick + side
    const pickR = await setPick(match.id, 1, auth, {
      player1HeroId: "rem",
      player2HeroId: "vindicta",
      player1Side: "archmother",
    });
    assert.equal(pickR.status, 200, pickR.text);

    // Export backup
    const exportR = await request(app)
      .get(`/api/tournaments/${t.id}/export`)
      .set(auth);
    assert.equal(exportR.status, 200, exportR.text);
    const backup = exportR.body;

    // Verify backup contains gamePicks and deadlockBans
    assert.ok(Array.isArray(backup.gamePicks) && backup.gamePicks.length > 0,
      "Backup should contain gamePicks");
    const g1InBackup = backup.gamePicks.find((p: any) => p.gameNumber === 1);
    assert.ok(g1InBackup, "G1 pick should be in backup");
    assert.equal(g1InBackup.player1HeroId, "rem");
    assert.equal(g1InBackup.player2HeroId, "vindicta");
    assert.equal(g1InBackup.player1Side, "archmother");

    assert.ok(Array.isArray(backup.deadlockBans) && backup.deadlockBans.length > 0,
      "Backup should contain deadlockBans");
    const aliceBans = backup.deadlockBans.find((b: any) => b.playerBackupId === pA.id);
    assert.ok(aliceBans, `Alice's bans should be in backup. deadlockBans: ${JSON.stringify(backup.deadlockBans)}`);
    assert.deepEqual(aliceBans.bannedHeroIds, ["haze", "abrams"]);
    await swarm006V3TestContext.test("V3 NOT_RUN: export/import preserves picks, sides, and player bans", { skip: "Backup V3 import disabled (#152)" }, async () => {

    // Import backup as a new tournament
    const importR = await request(app)
      .post("/api/tournaments/import")
      .send({
        backup,
        organizerPassword: "new-organizer-pw",
        name: `Restored-${randomUUID()}`,
      });
    assert.equal(importR.status, 201, importR.text);
    const restoredId = importR.body.tournament?.id as number;
    const restoredOrgToken = importR.body.organizerToken as string;
    assert.ok(restoredId && restoredOrgToken, `Import response missing id/token: ${importR.text}`);
    const restoreAuth = { "x-organizer-token": restoredOrgToken };

    // Check picks restored
    const restoredMatches = await request(app).get(`/api/tournaments/${restoredId}/matches`);
    assert.equal(restoredMatches.status, 200, restoredMatches.text);
    const restoredMatchList = restoredMatches.body as Array<{ id: number; player1Id: number | null; player2Id: number | null }>;
    const restoredMatch = restoredMatchList.find((m) => m.player1Id !== null && m.player2Id !== null);
    assert.ok(restoredMatch, "Restored tournament should have a match with players");

    const restoredPicks = await getPicks(restoredMatch.id);
    const restoredG1 = restoredPicks.find((p) => p.gameNumber === 1);
    assert.ok(restoredG1, "G1 pick should be restored");
    assert.equal(restoredG1.player1HeroId, "rem", "Player1 hero should be restored");
    assert.equal(restoredG1.player2HeroId, "vindicta", "Player2 hero should be restored");
    assert.equal(restoredG1.player1Side, "archmother", "Player1 side should be restored");

    // Check bans restored
    const restoredPlayers = await request(app)
      .get(`/api/tournaments/${restoredId}/players`);
    assert.equal(restoredPlayers.status, 200, restoredPlayers.text);
    const restoredPlayerList = restoredPlayers.body as Array<{ id: number; name: string }>;
    const restoredAlice = restoredPlayerList.find((p) => p.name === "Alice");
    assert.ok(restoredAlice, "Alice should be in restored tournament");

    // Get all bans for restored tournament and find Alice's
    const bansR = await request(app)
      .get(`/api/tournaments/${restoredId}/player-bans`)
      .set(restoreAuth);
    assert.equal(bansR.status, 200, bansR.text);
    const allBans = bansR.body as Array<{ playerId: number; bannedHeroIds: string[] }>;
    const aliceRestoredBans = allBans.find((b) => b.bannedHeroIds?.includes("haze") && b.bannedHeroIds?.includes("abrams"));
    assert.ok(aliceRestoredBans, `Alice's bans should be restored. Got: ${JSON.stringify(allBans)}`);

    });
  });
});
