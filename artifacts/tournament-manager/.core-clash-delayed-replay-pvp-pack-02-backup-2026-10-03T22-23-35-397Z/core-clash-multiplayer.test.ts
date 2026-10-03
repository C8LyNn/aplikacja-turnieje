import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import request from "supertest";
import {
  createCoreClashMultiplayerRouter,
  resetCoreClashMultiplayerForTests,
} from "../src/routes/core-clash-multiplayer";

function makeApp() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api", createCoreClashMultiplayerRouter());
  return app;
}

const deckA = ["anchor", "blink", "booster", "bounce", "dart", "fire", "glue", "regen", "armorer"];
const deckB = ["breaker", "cascade", "centerstep", "cindertrail", "cryolance", "deathpulse", "deathshield", "embertrap", "executioner"];

test.beforeEach(() => resetCoreClashMultiplayerForTests());

test("room browser + join + decks + authority handoff", async () => {
  const app = makeApp();

  const create = await request(app)
    .post("/api/core-clash/rooms")
    .send({ playerName: "A", roomName: "Test room", public: true })
    .expect(201);

  assert.equal(create.body.side, "player");
  const roomId = create.body.room.id as string;
  const tokenA = create.body.token as string;

  const browse = await request(app).get("/api/core-clash/rooms").expect(200);
  assert.equal(browse.body.rooms.length, 1);
  assert.equal(browse.body.rooms[0].name, "Test room");

  const join = await request(app)
    .post(`/api/core-clash/rooms/${roomId}/join`)
    .send({ playerName: "B" })
    .expect(200);
  assert.equal(join.body.side, "cpu");
  const tokenB = join.body.token as string;

  await request(app)
    .post(`/api/core-clash/rooms/${roomId}/deck`)
    .send({ token: tokenA, deck: deckA })
    .expect(200);

  const ready = await request(app)
    .post(`/api/core-clash/rooms/${roomId}/deck`)
    .send({ token: tokenB, deck: deckB })
    .expect(200);
  assert.equal(ready.body.room.bothReady, true);

  const initSnapshot = { state: { turn: "player", phase: "aim", gameOver: false }, matchStarted: true };
  const init = await request(app)
    .post(`/api/core-clash/rooms/${roomId}/snapshot`)
    .send({ token: tokenA, clientSeq: 1, reason: "init", snapshot: initSnapshot })
    .expect(200);
  assert.equal(init.body.authoritySide, "player");

  const switchSnapshot = { state: { turn: "cpu", phase: "waiting", gameOver: false }, matchStarted: true };
  const switched = await request(app)
    .post(`/api/core-clash/rooms/${roomId}/snapshot`)
    .send({ token: tokenA, clientSeq: 2, reason: "turn-cpu", snapshot: switchSnapshot })
    .expect(200);
  assert.equal(switched.body.authoritySide, "cpu");

  await request(app)
    .post(`/api/core-clash/rooms/${roomId}/snapshot`)
    .send({ token: tokenA, clientSeq: 3, reason: "illegal", snapshot: switchSnapshot })
    .expect(409);

  const cpuSnapshot = { state: { turn: "player", phase: "waiting", gameOver: false }, matchStarted: true };
  const back = await request(app)
    .post(`/api/core-clash/rooms/${roomId}/snapshot`)
    .send({ token: tokenB, clientSeq: 1, reason: "turn-player", snapshot: cpuSnapshot })
    .expect(200);
  assert.equal(back.body.authoritySide, "player");

  const state = await request(app)
    .get(`/api/core-clash/rooms/${roomId}/state`)
    .query({ token: tokenA, since: 0 })
    .expect(200);
  assert.equal(state.body.room.players.player.deck.length, 9);
  assert.equal(state.body.room.players.cpu.deck.length, 9);
  assert.equal(state.body.snapshot.state.turn, "player");
});

test("quick matchmaking pairs two arbitrary players", async () => {
  const app = makeApp();
  const first = await request(app)
    .post("/api/core-clash/matchmaking")
    .send({ playerName: "One" })
    .expect(201);
  assert.equal(first.body.matched, false);

  const second = await request(app)
    .post("/api/core-clash/matchmaking")
    .send({ playerName: "Two" })
    .expect(200);
  assert.equal(second.body.matched, true);
  assert.equal(second.body.room.id, first.body.room.id);
  assert.equal(second.body.room.playerCount, 2);
});
