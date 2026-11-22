// V6.1 · full Double Elimination runs through the public API: standard structure for 4/8/16/32
// entrants, BYE fields, result corrections that cascade through both brackets, the Grand Final, the
// conditional reset and a correction of the finals.
import { matchRevision } from "./match-revision-fixture";
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

type DbModule = typeof import("@workspace/db");
type DeMatch = {
  matchKey: string; matchId: number | null; name: string; bracket: string; status: string;
  slots: Array<string | null>; winnerParticipantKey: string | null; loserParticipantKey: string | null;
};
type DeState = {
  revision: number; completed: boolean; championParticipantKey: string | null;
  participants: Array<{ participantKey: string; losses: number; status: string }>;
  matches: DeMatch[];
};

let app: Express;
let database: DbModule;
let config: TestDatabaseConfig;

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `de-full-runs-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  app = (await import("../src/app")).default;
});

after(async () => {
  await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

async function createStartedDe(entrants: number) {
  const created = await request(app).post("/api/tournaments").send({
    organizerPassword: "de-full-runs-password",
    name: `DE full run ${entrants} ${randomUUID()}`,
    format: "double_elimination",
    maxPlayers: Math.max(4, entrants),
    defaultBestOf: 3,
    visibility: "public_online",
  }).expect(201);
  const tournamentId = created.body.id as number;
  const organizer = { "x-organizer-token": created.body.organizerToken as string };
  for (let seed = 1; seed <= entrants; seed += 1) {
    await request(app).post(`/api/tournaments/${tournamentId}/players`).set(organizer).send({ name: `P${seed}` }).expect(201);
  }
  await request(app).post(`/api/tournaments/${tournamentId}/start`).set(organizer).expect(200);
  const stages = await request(app).get(`/api/tournaments/${tournamentId}/stages`).expect(200);
  const stageId = stages.body[0].id as number;
  const read = async (): Promise<DeState> =>
    (await request(app).get(`/api/tournaments/${tournamentId}/stages/${stageId}/double-elimination`).expect(200)).body;
  const complete = async (match: DeMatch, winnerSlot: 0 | 1) => {
    assert.ok(match.matchId, `${match.name} has a match row`);
    const response = await request(app).post(`/api/matches/${match.matchId}/complete`).set(organizer).send({
      expectedRevision: await matchRevision(database, match.matchId), resultType: "played",
      score1: winnerSlot === 0 ? 2 : 1, score2: winnerSlot === 0 ? 1 : 2,
    });
    assert.equal(response.status, 200, `${match.name}: ${response.text}`);
  };
  const revert = async (match: DeMatch) => {
    assert.ok(match.matchId);
    const response = await request(app).post(`/api/matches/${match.matchId}/revert`).set(organizer)
      .send({ expectedRevision: await matchRevision(database, match.matchId) });
    assert.equal(response.status, 200, `revert ${match.name}: ${response.text}`);
  };
  /** Plays ready matches (earliest first) until `stop` says so or nothing is ready. */
  const play = async (winner: (m: DeMatch) => 0 | 1, stop: (s: DeState) => boolean = () => false) => {
    for (let guard = 0; guard < 200; guard += 1) {
      const state = await read();
      if (stop(state)) return state;
      const ready = state.matches.find((m) => m.status === "ready");
      if (!ready) return state;
      await complete(ready, winner(ready));
    }
    throw new Error("play loop did not finish");
  };
  return { tournamentId, read, complete, revert, play };
}

const byName = (state: DeState, name: string) => state.matches.find((m) => m.name === name)!;
const count = (state: DeState, prefix: string) => state.matches.filter((m) => m.name.startsWith(prefix)).length;

describe("Double Elimination full runs (V6.1)", () => {
  for (const size of [4, 8, 16, 32]) {
    test(`${size} entrants: standard structure, cascading correction, Grand Final + reset, finals correction`, async () => {
      const de = await createStartedDe(size);
      let state = await de.read();
      assert.equal(count(state, "Upper"), size - 1);
      assert.equal(count(state, "Lower"), size - 2);
      assert.equal(state.matches.filter((m) => m.bracket === "grand_final").length, 1);
      assert.equal(state.matches.filter((m) => m.bracket === "grand_final_reset").length, 1);

      // Upper R1, Lower R1 M1 and Upper R2 M1 played, then Upper R1 M1 corrected: the cascade clears both.
      state = await de.play(() => 0, (s) => byName(s, "Lower R1 M1").status === "completed"
        && byName(s, "Upper R2 M1").status === "completed");
      const firstLoser = byName(state, "Upper R1 M1").loserParticipantKey;
      assert.ok(byName(state, "Lower R1 M1").slots.includes(firstLoser));
      await de.revert(byName(state, "Upper R1 M1"));
      state = await de.read();
      assert.notEqual(byName(state, "Lower R1 M1").status, "completed");
      assert.notEqual(byName(state, "Upper R2 M1").status, "completed");
      assert.equal(byName(state, "Upper R1 M1").status, "ready");
      await de.complete(byName(state, "Upper R1 M1"), 1); // the other player wins this time
      state = await de.read();
      const newLoser = byName(state, "Upper R1 M1").loserParticipantKey;
      assert.notEqual(newLoser, firstLoser);
      assert.ok(byName(state, "Lower R1 M1").slots.includes(newLoser), "corrected loser drops into Lower R1 M1");

      // Play on; the Lower winner takes the Grand Final, so the reset is played.
      state = await de.play((m) => (m.bracket === "grand_final" ? 1 : 0));
      assert.equal(state.completed, true);
      assert.equal(byName(state, "Grand Final Reset").status, "completed");
      assert.ok(state.championParticipantKey);
      const lower = state.matches.filter((m) => m.bracket === "lower");
      assert.ok(lower.every((m) => m.status === "completed"), lower.filter((m) => m.status !== "completed").map((m) => `${m.name}:${m.status}`).join(", "));
      assert.equal(state.participants.filter((p) => p.losses >= 2).length, size - 1);

      // Finals correction: undo the reset and the Grand Final, the Upper winner now wins → no reset.
      await de.revert(byName(state, "Grand Final Reset"));
      state = await de.read();
      await de.revert(byName(state, "Grand Final"));
      state = await de.read();
      assert.equal(state.completed, false);
      const upperChampion = byName(state, "Grand Final").slots[0];
      await de.complete(byName(state, "Grand Final"), 0);
      state = await de.read();
      assert.equal(state.completed, true);
      assert.equal(state.championParticipantKey, upperChampion);
      assert.notEqual(byName(state, "Grand Final Reset").status, "completed");
    });
  }

  for (const size of [3, 5, 6, 12, 24]) {
    test(`${size} entrants (BYEs): the bracket of the next power of two completes without stuck matches`, async () => {
      const de = await createStartedDe(size);
      let state = await de.read();
      const bracketSize = 2 ** Math.ceil(Math.log2(size));
      assert.equal(count(state, "Upper"), bracketSize - 1);
      assert.equal(count(state, "Lower"), bracketSize - 2);
      assert.equal(state.matches.filter((m) => m.name.startsWith("Upper R1") && m.status === "bye").length, bracketSize - size);
      state = await de.play((m) => (m.name.length % 2 === 0 ? 0 : 1));
      assert.equal(state.completed, true);
      assert.ok(state.championParticipantKey);
      assert.deepEqual(state.matches.filter((m) => m.status === "ready" || m.status === "pending").map((m) => m.name), []);
      assert.equal(state.participants.filter((p) => p.losses >= 2).length, size - 1);
    });
  }
});
