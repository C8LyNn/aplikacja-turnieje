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
  app.use(express.json({ limit: "4mb" }));
  app.use("/api", createCoreClashMultiplayerRouter());
  return app;
}

const deckA = ["anchor", "blink", "booster", "bounce", "dart", "fire", "glue", "regen", "armorer"];
const deckB = ["breaker", "cascade", "centerstep", "cindertrail", "cryolance", "deathpulse", "deathshield", "embertrap", "executioner"];

test.beforeEach(() => resetCoreClashMultiplayerForTests());

async function readyRoom(app: ReturnType<typeof makeApp>) {
  const create = await request(app)
    .post("/api/core-clash/rooms")
    .send({ playerName: "A", roomName: "Replay room", public: true, browserId: "browser-a-0001" })
    .expect(201);
  const roomId = create.body.room.id as string;
  const tokenA = create.body.token as string;

  const join = await request(app)
    .post(`/api/core-clash/rooms/${roomId}/join`)
    .send({ playerName: "B", browserId: "browser-b-0001" })
    .expect(200);
  const tokenB = join.body.token as string;

  await request(app)
    .post(`/api/core-clash/rooms/${roomId}/deck`)
    .send({ token: tokenA, deck: deckA })
    .expect(200);
  await request(app)
    .post(`/api/core-clash/rooms/${roomId}/deck`)
    .send({ token: tokenB, deck: deckB })
    .expect(200);

  const initSnapshot = { state: { turn: "player", phase: "aim", gameOver: false }, matchStarted: true };
  await request(app)
    .post(`/api/core-clash/rooms/${roomId}/snapshot`)
    .send({ token: tokenA, clientSeq: 1, reason: "init", snapshot: initSnapshot })
    .expect(200);

  return { roomId, tokenA, tokenB };
}

async function finishRoom(app: ReturnType<typeof makeApp>, roomId: string, tokenA: string) {
  await request(app)
    .post(`/api/core-clash/rooms/${roomId}/snapshot`)
    .send({
      token: tokenA,
      clientSeq: 2,
      reason: "game-over",
      snapshot: {
        state: {
          turn: "player",
          phase: "over",
          gameOver: true,
          gameResult: { winner: "player", reason: "BAZA ZNISZCZONA", trigger: "" },
        },
        matchStarted: true,
      },
    })
    .expect(200);
}

test("room browser + decks + authority handoff still work", async () => {
  const app = makeApp();
  const { roomId, tokenA, tokenB } = await readyRoom(app);

  const switchSnapshot = { state: { turn: "cpu", phase: "waiting", gameOver: false }, matchStarted: true };
  const switched = await request(app)
    .post(`/api/core-clash/rooms/${roomId}/snapshot`)
    .send({ token: tokenA, clientSeq: 2, reason: "turn-cpu", snapshot: switchSnapshot })
    .expect(200);
  assert.equal(switched.body.authoritySide, "cpu");

  const cpuSnapshot = { state: { turn: "player", phase: "waiting", gameOver: false }, matchStarted: true };
  const back = await request(app)
    .post(`/api/core-clash/rooms/${roomId}/snapshot`)
    .send({ token: tokenB, clientSeq: 1, reason: "turn-player", snapshot: cpuSnapshot })
    .expect(200);
  assert.equal(back.body.authoritySide, "player");
});

test("delayed replay preserves ordered chunks across authority handoff", async () => {
  const app = makeApp();
  const { roomId, tokenA, tokenB } = await readyRoom(app);
  const actionId = "action-player-1";

  const first = await request(app)
    .post(`/api/core-clash/rooms/${roomId}/replay-chunk`)
    .send({
      token: tokenA,
      actionId,
      seq: 1,
      final: false,
      frames: [
        { t: 0, state: { turn: "player", phase: "moving", balls: [{ id: 1, x: 10, y: 20 }] } },
        { t: 33, state: { turn: "player", phase: "moving", balls: [{ id: 1, x: 20, y: 30 }] } },
      ],
    })
    .expect(200);
  assert.equal(first.body.globalSeq, 1);

  await request(app)
    .post(`/api/core-clash/rooms/${roomId}/snapshot`)
    .send({
      token: tokenA,
      clientSeq: 2,
      reason: "turn-cpu",
      snapshot: { state: { turn: "cpu", phase: "waiting", gameOver: false }, matchStarted: true },
    })
    .expect(200);

  const final = await request(app)
    .post(`/api/core-clash/rooms/${roomId}/replay-chunk`)
    .send({
      token: tokenA,
      actionId,
      seq: 2,
      final: true,
      frames: [{ t: 66, state: { turn: "cpu", phase: "waiting", balls: [{ id: 1, x: 30, y: 40 }] } }],
    })
    .expect(200);
  assert.equal(final.body.globalSeq, 2);

  const replay = await request(app)
    .get(`/api/core-clash/rooms/${roomId}/replay`)
    .query({ token: tokenB, after: 0 })
    .expect(200);
  assert.equal(replay.body.chunks.length, 2);
  assert.deepEqual(replay.body.chunks.map((chunk: { seq: number }) => chunk.seq), [1, 2]);
  assert.equal(replay.body.chunks[1].final, true);
  assert.equal(replay.body.chunks[0].side, "player");
});

test("replay chunks require contiguous sequence", async () => {
  const app = makeApp();
  const { roomId, tokenA } = await readyRoom(app);
  await request(app)
    .post(`/api/core-clash/rooms/${roomId}/replay-chunk`)
    .send({ token: tokenA, actionId: "gap", seq: 2, final: false, frames: [{ t: 0, state: {} }] })
    .expect(409);
});

test("quick matchmaking pairs two active browsers", async () => {
  const app = makeApp();
  const first = await request(app)
    .post("/api/core-clash/matchmaking")
    .send({ playerName: "One", browserId: "browser-quick-1" })
    .expect(201);
  assert.equal(first.body.matched, false);

  const second = await request(app)
    .post("/api/core-clash/matchmaking")
    .send({ playerName: "Two", browserId: "browser-quick-2" })
    .expect(200);
  assert.equal(second.body.matched, true);
  assert.equal(second.body.room.id, first.body.room.id);
});

test("one browser cannot host many public servers at once", async () => {
  const app = makeApp();
  const first = await request(app)
    .post("/api/core-clash/rooms")
    .send({ playerName: "Host", roomName: "One", public: true, browserId: "browser-limit-1" })
    .expect(201);

  const duplicate = await request(app)
    .post("/api/core-clash/rooms")
    .send({ playerName: "Host", roomName: "Two", public: true, browserId: "browser-limit-1" })
    .expect(409);
  assert.equal(duplicate.body.code, "BROWSER_ROOM_LIMIT");

  await request(app)
    .post(`/api/core-clash/rooms/${first.body.room.id}/leave`)
    .send({ token: first.body.token })
    .expect(200);

  await request(app)
    .post("/api/core-clash/rooms")
    .send({ playerName: "Host", roomName: "Three", public: true, browserId: "browser-limit-1" })
    .expect(201);
});

test("same-deck rematch needs both votes, swaps sides and keeps decks", async () => {
  const app = makeApp();
  const { roomId, tokenA, tokenB } = await readyRoom(app);
  await finishRoom(app, roomId, tokenA);

  const voteA = await request(app)
    .post(`/api/core-clash/rooms/${roomId}/rematch`)
    .send({ token: tokenA })
    .expect(200);
  assert.equal(voteA.body.started, false);
  assert.equal(voteA.body.room.round, 1);

  const voteB = await request(app)
    .post(`/api/core-clash/rooms/${roomId}/rematch`)
    .send({ token: tokenB })
    .expect(200);
  assert.equal(voteB.body.started, true);
  assert.equal(voteB.body.room.round, 2);
  assert.equal(voteB.body.room.bothReady, true);
  assert.equal(voteB.body.side, "player");

  const stateA = await request(app)
    .get(`/api/core-clash/rooms/${roomId}/state`)
    .query({ token: tokenA, since: -1 })
    .expect(200);
  assert.equal(stateA.body.side, "cpu");
  assert.deepEqual(stateA.body.room.players.cpu.deck, deckA);
  assert.deepEqual(stateA.body.room.players.player.deck, deckB);
});

test("if either player requests a deck change, the next agreed round swaps sides and returns both to draft", async () => {
  const app = makeApp();
  const { roomId, tokenA, tokenB } = await readyRoom(app);
  await finishRoom(app, roomId, tokenA);

  const deckVote = await request(app)
    .post(`/api/core-clash/rooms/${roomId}/change-deck`)
    .send({ token: tokenA })
    .expect(200);
  assert.equal(deckVote.body.started, false);
  assert.equal(deckVote.body.room.round, 1);

  const accept = await request(app)
    .post(`/api/core-clash/rooms/${roomId}/rematch`)
    .send({ token: tokenB })
    .expect(200);
  assert.equal(accept.body.started, true);
  assert.equal(accept.body.changeDecks, true);
  assert.equal(accept.body.room.round, 2);
  assert.equal(accept.body.room.bothReady, false);
  assert.equal(accept.body.side, "player");
  assert.equal(accept.body.room.players.player.deck, null);
  assert.equal(accept.body.room.players.cpu.deck, null);
});

test("leaving a finished public server keeps the remaining player in a reusable waiting room", async () => {
  const app = makeApp();
  const { roomId, tokenA, tokenB } = await readyRoom(app);
  await finishRoom(app, roomId, tokenA);

  await request(app)
    .post(`/api/core-clash/rooms/${roomId}/leave`)
    .send({ token: tokenB })
    .expect(200);

  const remaining = await request(app)
    .get(`/api/core-clash/rooms/${roomId}/state`)
    .query({ token: tokenA, since: -1 })
    .expect(200);
  assert.equal(remaining.body.room.status, "waiting");
  assert.equal(remaining.body.room.playerCount, 1);
  assert.equal(remaining.body.side, "player");
});
