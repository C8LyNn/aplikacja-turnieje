import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";

type Side = "player" | "cpu";
type RoomStatus = "waiting" | "draft" | "playing" | "finished";
type NextRoundVote = "same" | "deck";

interface RoomPlayer {
  token: string;
  name: string;
  browserId: string;
  side: Side;
  ready: boolean;
  deck: string[] | null;
  lastSeenAt: number;
  lastClientSeq: number;
}

interface ReplayChunk {
  globalSeq: number;
  actionId: string;
  actionNo: number;
  side: Side;
  seq: number;
  final: boolean;
  frames: unknown[];
  createdAt: number;
}

interface ReplayAction {
  id: string;
  actionNo: number;
  side: Side;
  lastSeq: number;
  final: boolean;
  chunks: ReplayChunk[];
  createdAt: number;
  updatedAt: number;
}

interface CoreClashRoom {
  id: string;
  name: string;
  public: boolean;
  matchmaking: boolean;
  status: RoomStatus;
  players: Partial<Record<Side, RoomPlayer>>;
  snapshot: unknown | null;
  version: number;
  authoritySide: Side;
  createdAt: number;
  updatedAt: number;
  replayGlobalSeq: number;
  replayActionCounter: number;
  replayActions: ReplayAction[];
  round: number;
  rematchVotes: Partial<Record<Side, NextRoundVote>>;
  ownerBrowserId: string;
}

const rooms = new Map<string, CoreClashRoom>();
const ROOM_TTL_MS = 45 * 60 * 1_000;
const MATCHMAKING_STALE_MS = 8_000;
const PUBLIC_WAITING_STALE_MS = 90_000;
const PLAYER_CONNECTED_MS = 5_000;
const PLAYER_RECONNECT_GRACE_MS = 45_000;
const SNAPSHOT_MAX_APPROX_BYTES = 1_500_000;
const REPLAY_CHUNK_MAX_APPROX_BYTES = 1_500_000;
const MAX_REPLAY_ACTIONS = 16;
const MAX_REPLAY_CHUNKS_PER_ACTION = 180;
const MAX_REPLAY_FRAMES_PER_CHUNK = 12;

function now(): number {
  return Date.now();
}

function cleanText(value: unknown, fallback: string, max = 32): string {
  const text = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  return (text || fallback).slice(0, max);
}

function cleanBrowserId(value: unknown): string {
  if (typeof value !== "string") return randomUUID();
  const normalized = value.trim().replace(/[^a-z0-9_-]/gi, "").slice(0, 96);
  return normalized.length >= 8 ? normalized : randomUUID();
}

function validDeck(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length === 9 &&
    new Set(value).size === 9 &&
    value.every((item) => typeof item === "string" && /^[a-z0-9_-]{1,64}$/i.test(item))
  );
}

function cleanupRooms(): void {
  const timestamp = now();
  const roomCutoff = timestamp - ROOM_TTL_MS;
  for (const [id, room] of rooms) {
    if (room.updatedAt < roomCutoff) {
      rooms.delete(id);
      continue;
    }

    const participants = (["player", "cpu"] as const)
      .map((side) => room.players[side])
      .filter((player): player is RoomPlayer => Boolean(player));

    if (participants.length === 2) {
      const stalePlayers = participants.filter(
        (player) => timestamp - player.lastSeenAt > PLAYER_RECONNECT_GRACE_MS,
      );
      if (stalePlayers.length === 2) {
        rooms.delete(id);
        continue;
      }
      if (stalePlayers.length === 1) {
        if (room.matchmaking) {
          rooms.delete(id);
        } else {
          resetPublicRoomAfterLeave(room, stalePlayers[0]);
        }
        continue;
      }
    }

    if (room.status !== "waiting" || playerCount(room) !== 1) continue;
    const host = room.players.player;
    if (!host) {
      rooms.delete(id);
      continue;
    }
    const staleFor = timestamp - host.lastSeenAt;
    if (room.matchmaking && staleFor > MATCHMAKING_STALE_MS) {
      rooms.delete(id);
    } else if (!room.matchmaking && staleFor > PUBLIC_WAITING_STALE_MS) {
      rooms.delete(id);
    }
  }
}

function playerCount(room: CoreClashRoom): number {
  return Number(Boolean(room.players.player)) + Number(Boolean(room.players.cpu));
}

function bothReady(room: CoreClashRoom): boolean {
  return Boolean(room.players.player?.ready && room.players.cpu?.ready);
}

function playerForToken(room: CoreClashRoom, token: unknown): RoomPlayer | null {
  if (typeof token !== "string" || !token) return null;
  for (const side of ["player", "cpu"] as const) {
    const player = room.players[side];
    if (player?.token === token) return player;
  }
  return null;
}

function touch(room: CoreClashRoom, player?: RoomPlayer | null): void {
  const timestamp = now();
  room.updatedAt = timestamp;
  if (player) player.lastSeenAt = timestamp;
}

function latestReplay(room: CoreClashRoom): ReplayAction | null {
  return room.replayActions.length ? room.replayActions[room.replayActions.length - 1] : null;
}

function roomView(room: CoreClashRoom, includeDecks = false) {
  const timestamp = now();
  const mapPlayer = (player?: RoomPlayer) =>
    player
      ? {
          name: player.name,
          side: player.side,
          ready: player.ready,
          connected: timestamp - player.lastSeenAt <= PLAYER_CONNECTED_MS,
          reconnectGraceMs: Math.max(0, PLAYER_RECONNECT_GRACE_MS - (timestamp - player.lastSeenAt)),
          ...(includeDecks ? { deck: player.deck } : {}),
        }
      : null;
  const latest = latestReplay(room);
  return {
    id: room.id,
    name: room.name,
    public: room.public,
    matchmaking: room.matchmaking,
    status: room.status,
    playerCount: playerCount(room),
    players: {
      player: mapPlayer(room.players.player),
      cpu: mapPlayer(room.players.cpu),
    },
    bothReady: bothReady(room),
    hasSnapshot: room.snapshot !== null,
    version: room.version,
    replayGlobalSeq: room.replayGlobalSeq,
    latestReplayActionId: latest?.id ?? null,
    latestReplaySide: latest?.side ?? null,
    latestReplayFinal: latest?.final ?? false,
    round: room.round,
    rematchVotes: {
      player: room.rematchVotes.player ?? null,
      cpu: room.rematchVotes.cpu ?? null,
    },
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}

function browserRoomView(room: CoreClashRoom) {
  return {
    id: room.id,
    name: room.name,
    hostName: room.players.player?.name ?? "Gracz",
    playerCount: playerCount(room),
    createdAt: room.createdAt,
  };
}

function createRoom(
  playerName: string,
  roomName: string,
  isPublic: boolean,
  matchmaking: boolean,
  browserId: string,
) {
  const timestamp = now();
  const room: CoreClashRoom = {
    id: randomUUID(),
    name: cleanText(roomName, matchmaking ? "Szybki mecz" : `${playerName} — pokój`, 32),
    public: isPublic,
    matchmaking,
    status: "waiting",
    players: {},
    snapshot: null,
    version: 0,
    authoritySide: "player",
    createdAt: timestamp,
    updatedAt: timestamp,
    replayGlobalSeq: 0,
    replayActionCounter: 0,
    replayActions: [],
    round: 1,
    rematchVotes: {},
    ownerBrowserId: browserId,
  };

  const player: RoomPlayer = {
    token: randomUUID(),
    name: cleanText(playerName, "Gracz 1", 24),
    browserId,
    side: "player",
    ready: false,
    deck: null,
    lastSeenAt: timestamp,
    lastClientSeq: 0,
  };

  room.players.player = player;
  rooms.set(room.id, room);
  return { room, player };
}

function joinRoom(room: CoreClashRoom, playerName: string, browserId: string) {
  if (room.players.cpu) throw new Error("ROOM_FULL");
  const timestamp = now();
  const player: RoomPlayer = {
    token: randomUUID(),
    name: cleanText(playerName, "Gracz 2", 24),
    browserId,
    side: "cpu",
    ready: false,
    deck: null,
    lastSeenAt: timestamp,
    lastClientSeq: 0,
  };
  room.players.cpu = player;
  room.status = "draft";
  touch(room, player);
  return player;
}

function sideFromSnapshot(snapshot: unknown): Side | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const state = (snapshot as { state?: unknown }).state;
  if (!state || typeof state !== "object") return null;
  const turn = (state as { turn?: unknown }).turn;
  return turn === "player" || turn === "cpu" ? turn : null;
}

function validReplayFrames(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0 && value.length <= MAX_REPLAY_FRAMES_PER_CHUNK;
}

function findReplayAction(room: CoreClashRoom, actionId: string): ReplayAction | undefined {
  return room.replayActions.find((action) => action.id === actionId);
}

function resetReplay(room: CoreClashRoom): void {
  room.replayGlobalSeq = 0;
  room.replayActionCounter = 0;
  room.replayActions = [];
}

function activeHostedRoom(browserId: string): CoreClashRoom | null {
  if (!browserId) return null;
  for (const room of rooms.values()) {
    if (room.ownerBrowserId === browserId && playerCount(room) > 0) return room;
  }
  return null;
}

function swapRoomSides(room: CoreClashRoom): void {
  const previousPlayer = room.players.player;
  const previousCpu = room.players.cpu;
  room.players = {};
  if (previousCpu) {
    previousCpu.side = "player";
    room.players.player = previousCpu;
  }
  if (previousPlayer) {
    previousPlayer.side = "cpu";
    room.players.cpu = previousPlayer;
  }
}

function resetForNextRound(room: CoreClashRoom, changeDecks: boolean): void {
  if (playerCount(room) !== 2) return;
  swapRoomSides(room);
  room.round += 1;
  room.snapshot = null;
  room.version += 1;
  room.authoritySide = "player";
  room.status = "draft";
  room.rematchVotes = {};
  resetReplay(room);
  for (const side of ["player", "cpu"] as const) {
    const participant = room.players[side];
    if (!participant) continue;
    participant.lastClientSeq = 0;
    if (changeDecks) {
      participant.ready = false;
      participant.deck = null;
    } else {
      participant.ready = validDeck(participant.deck);
    }
  }
  touch(room);
}

function resetPublicRoomAfterLeave(room: CoreClashRoom, leaving: RoomPlayer): void {
  delete room.players[leaving.side];
  const remaining = room.players.player ?? room.players.cpu;
  if (!remaining) {
    rooms.delete(room.id);
    return;
  }

  room.players = {};
  remaining.side = "player";
  remaining.ready = false;
  remaining.deck = null;
  remaining.lastClientSeq = 0;
  room.players.player = remaining;
  room.ownerBrowserId = remaining.browserId;
  room.status = "waiting";
  room.snapshot = null;
  room.version += 1;
  room.authoritySide = "player";
  room.rematchVotes = {};
  resetReplay(room);
  touch(room, remaining);
}

export function resetCoreClashMultiplayerForTests(): void {
  rooms.clear();
}

export function createCoreClashMultiplayerRouter(): IRouter {
  const router: IRouter = Router();

  router.use((_req, _res, next) => {
    cleanupRooms();
    next();
  });

  router.get("/core-clash/rooms", (req, res) => {
    const q = cleanText(req.query["q"], "", 64).toLowerCase();
    const list = [...rooms.values()]
      .filter(
        (room) =>
          room.public &&
          !room.matchmaking &&
          room.status === "waiting" &&
          playerCount(room) === 1,
      )
      .filter((room) => {
        if (!q) return true;
        const host = room.players.player?.name ?? "";
        return room.name.toLowerCase().includes(q) || host.toLowerCase().includes(q);
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50)
      .map(browserRoomView);

    res.json({ rooms: list });
  });

  router.post("/core-clash/rooms", (req, res) => {
    cleanupRooms();
    const playerName = cleanText(req.body?.playerName, "Gracz 1", 24);
    const roomName = cleanText(req.body?.roomName, `${playerName} — pokój`, 32);
    const browserId = cleanBrowserId(req.body?.browserId);
    const existing = activeHostedRoom(browserId);
    if (existing) {
      res.status(409).json({
        error: "Ta przeglądarka ma już aktywny serwer.",
        code: "BROWSER_ROOM_LIMIT",
        existingRoom: browserRoomView(existing),
      });
      return;
    }
    const created = createRoom(playerName, roomName, req.body?.public !== false, false, browserId);
    res.status(201).json({
      room: roomView(created.room, true),
      token: created.player.token,
      side: created.player.side,
      version: created.room.version,
    });
  });

  router.post("/core-clash/rooms/:roomId/join", (req, res) => {
    const room = rooms.get(req.params.roomId);
    if (!room || room.status !== "waiting") {
      res.status(404).json({ error: "Pokój nie jest już dostępny.", code: "ROOM_NOT_AVAILABLE" });
      return;
    }

    try {
      const browserId = cleanBrowserId(req.body?.browserId);
      const sameBrowserAlreadyPresent = (["player", "cpu"] as const).some(
        (side) => room.players[side]?.browserId === browserId,
      );
      if (sameBrowserAlreadyPresent) {
        res.status(409).json({
          error: "Ta przeglądarka jest już uczestnikiem tego pokoju.",
          code: "SAME_BROWSER_SESSION",
        });
        return;
      }
      const player = joinRoom(
        room,
        cleanText(req.body?.playerName, "Gracz 2", 24),
        browserId,
      );
      res.json({
        room: roomView(room, true),
        token: player.token,
        side: player.side,
        version: room.version,
      });
    } catch {
      res.status(409).json({ error: "Pokój jest pełny.", code: "ROOM_FULL" });
    }
  });

  router.post("/core-clash/matchmaking", (req, res) => {
    cleanupRooms();
    const playerName = cleanText(req.body?.playerName, "Gracz", 24);
    const browserId = cleanBrowserId(req.body?.browserId);
    const existingOwned = activeHostedRoom(browserId);
    if (existingOwned) {
      res.status(409).json({
        error: "Ta przeglądarka ma już aktywną sesję hosta.",
        code: "BROWSER_ROOM_LIMIT",
        existingRoom: browserRoomView(existingOwned),
      });
      return;
    }
    const freshCutoff = now() - MATCHMAKING_STALE_MS;
    const open = [...rooms.values()]
      .filter(
        (room) =>
          room.matchmaking &&
          room.status === "waiting" &&
          playerCount(room) === 1 &&
          room.players.player?.browserId !== browserId &&
          (room.players.player?.lastSeenAt ?? 0) >= freshCutoff,
      )
      .sort((a, b) => a.createdAt - b.createdAt)[0];

    if (open) {
      const player = joinRoom(open, playerName, browserId);
      res.json({
        room: roomView(open, true),
        token: player.token,
        side: player.side,
        version: open.version,
        matched: true,
      });
      return;
    }

    const created = createRoom(playerName, "Szybki mecz", false, true, browserId);
    res.status(201).json({
      room: roomView(created.room, true),
      token: created.player.token,
      side: created.player.side,
      version: created.room.version,
      matched: false,
    });
  });

  router.post("/core-clash/rooms/:roomId/deck", (req, res) => {
    const room = rooms.get(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: "Nie znaleziono pokoju.", code: "ROOM_NOT_FOUND" });
      return;
    }
    const player = playerForToken(room, req.body?.token);
    if (!player) {
      res.status(403).json({ error: "Nieprawidłowy token gracza.", code: "INVALID_PLAYER_TOKEN" });
      return;
    }
    if (!validDeck(req.body?.deck)) {
      res.status(400).json({ error: "Talia musi zawierać 9 różnych typów kulek.", code: "INVALID_DECK" });
      return;
    }

    player.deck = [...req.body.deck];
    player.ready = true;
    room.status = bothReady(room) ? "draft" : room.status;
    touch(room, player);
    res.json({ room: roomView(room, true), version: room.version });
  });

  router.get("/core-clash/rooms/:roomId/state", (req, res) => {
    const room = rooms.get(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: "Nie znaleziono pokoju.", code: "ROOM_NOT_FOUND" });
      return;
    }
    const player = playerForToken(room, req.query["token"]);
    if (!player) {
      res.status(403).json({ error: "Nieprawidłowy token gracza.", code: "INVALID_PLAYER_TOKEN" });
      return;
    }
    touch(room, player);
    const since = Number(req.query["since"] ?? -1);
    const includeSnapshot = room.snapshot !== null && (!Number.isFinite(since) || room.version > since);
    res.json({
      room: roomView(room, true),
      side: player.side,
      version: room.version,
      snapshot: includeSnapshot ? room.snapshot : null,
    });
  });

  router.post("/core-clash/rooms/:roomId/snapshot", (req, res) => {
    const room = rooms.get(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: "Nie znaleziono pokoju.", code: "ROOM_NOT_FOUND" });
      return;
    }
    const player = playerForToken(room, req.body?.token);
    if (!player) {
      res.status(403).json({ error: "Nieprawidłowy token gracza.", code: "INVALID_PLAYER_TOKEN" });
      return;
    }
    if (!bothReady(room)) {
      res.status(409).json({ error: "Obaj gracze muszą zatwierdzić talie.", code: "DECKS_NOT_READY" });
      return;
    }

    const clientSeq = Number(req.body?.clientSeq);
    if (!Number.isInteger(clientSeq) || clientSeq <= player.lastClientSeq) {
      res.status(409).json({ error: "Nieaktualna paczka synchronizacji.", code: "STALE_CLIENT_SEQUENCE" });
      return;
    }

    if (room.authoritySide !== player.side) {
      res.status(409).json({ error: "Ten gracz nie ma teraz autorytetu nad stanem meczu.", code: "NOT_STATE_AUTHORITY" });
      return;
    }

    const snapshot = req.body?.snapshot;
    if (!snapshot || typeof snapshot !== "object") {
      res.status(400).json({ error: "Brak stanu meczu.", code: "INVALID_SNAPSHOT" });
      return;
    }

    const approximateSize = Buffer.byteLength(JSON.stringify(snapshot), "utf8");
    if (approximateSize > SNAPSHOT_MAX_APPROX_BYTES) {
      res.status(413).json({ error: "Stan meczu jest zbyt duży.", code: "SNAPSHOT_TOO_LARGE" });
      return;
    }

    const nextAuthority = sideFromSnapshot(snapshot);
    if (!nextAuthority) {
      res.status(400).json({ error: "Stan meczu nie zawiera poprawnej tury.", code: "INVALID_TURN" });
      return;
    }

    player.lastClientSeq = clientSeq;
    room.snapshot = snapshot;
    room.version += 1;
    room.authoritySide = nextAuthority;
    room.status = (snapshot as { state?: { gameOver?: unknown } }).state?.gameOver ? "finished" : "playing";
    touch(room, player);

    res.json({ version: room.version, authoritySide: room.authoritySide });
  });

  function recordNextRoundVote(room: CoreClashRoom, player: RoomPlayer, vote: NextRoundVote) {
    room.rematchVotes[player.side] = vote;
    touch(room, player);
    const votePlayer = room.rematchVotes.player;
    const voteCpu = room.rematchVotes.cpu;
    if (!votePlayer || !voteCpu) {
      return { started: false, changeDecks: false };
    }
    const changeDecks = votePlayer === "deck" || voteCpu === "deck";
    resetForNextRound(room, changeDecks);
    return { started: true, changeDecks };
  }

  router.post("/core-clash/rooms/:roomId/rematch", (req, res) => {
    const room = rooms.get(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: "Nie znaleziono pokoju.", code: "ROOM_NOT_FOUND" });
      return;
    }
    const player = playerForToken(room, req.body?.token);
    if (!player) {
      res.status(403).json({ error: "Nieprawidłowy token gracza.", code: "INVALID_PLAYER_TOKEN" });
      return;
    }
    if (playerCount(room) !== 2) {
      res.status(409).json({ error: "Przeciwnik opuścił serwer.", code: "OPPONENT_LEFT" });
      return;
    }

    if (room.status === "finished") {
      const result = recordNextRoundVote(room, player, "same");
      res.json({ room: roomView(room, true), side: player.side, ...result, version: room.version });
      return;
    }

    if (room.status === "draft" && room.snapshot === null) {
      touch(room, player);
      res.json({ room: roomView(room, true), side: player.side, started: false, changeDecks: !bothReady(room), version: room.version });
      return;
    }

    res.status(409).json({ error: "Rewanż jest dostępny po zakończeniu meczu.", code: "REMATCH_NOT_AVAILABLE" });
  });

  router.post("/core-clash/rooms/:roomId/change-deck", (req, res) => {
    const room = rooms.get(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: "Nie znaleziono pokoju.", code: "ROOM_NOT_FOUND" });
      return;
    }
    const player = playerForToken(room, req.body?.token);
    if (!player) {
      res.status(403).json({ error: "Nieprawidłowy token gracza.", code: "INVALID_PLAYER_TOKEN" });
      return;
    }
    if (playerCount(room) !== 2) {
      res.status(409).json({ error: "Przeciwnik opuścił serwer.", code: "OPPONENT_LEFT" });
      return;
    }

    if (room.status === "finished") {
      const result = recordNextRoundVote(room, player, "deck");
      res.json({ room: roomView(room, true), side: player.side, ...result, version: room.version });
      return;
    }

    if (room.status === "draft" && room.snapshot === null) {
      touch(room, player);
      res.json({ room: roomView(room, true), side: player.side, started: false, changeDecks: true, version: room.version });
      return;
    }

    res.status(409).json({ error: "Zmiana talii jest dostępna po zakończeniu meczu.", code: "DECK_CHANGE_NOT_AVAILABLE" });
  });

  router.post("/core-clash/rooms/:roomId/replay-chunk", (req, res) => {
    const room = rooms.get(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: "Nie znaleziono pokoju.", code: "ROOM_NOT_FOUND" });
      return;
    }
    const player = playerForToken(room, req.body?.token);
    if (!player) {
      res.status(403).json({ error: "Nieprawidłowy token gracza.", code: "INVALID_PLAYER_TOKEN" });
      return;
    }
    if (!bothReady(room)) {
      res.status(409).json({ error: "Mecz nie jest gotowy.", code: "DECKS_NOT_READY" });
      return;
    }

    const actionId = cleanText(req.body?.actionId, "", 96);
    const seq = Number(req.body?.seq);
    const final = req.body?.final === true;
    const frames = req.body?.frames;
    if (!actionId || !Number.isInteger(seq) || seq < 1 || !validReplayFrames(frames)) {
      res.status(400).json({ error: "Nieprawidłowa paczka replay.", code: "INVALID_REPLAY_CHUNK" });
      return;
    }

    const approximateSize = Buffer.byteLength(JSON.stringify({ actionId, seq, final, frames }), "utf8");
    if (approximateSize > REPLAY_CHUNK_MAX_APPROX_BYTES) {
      res.status(413).json({ error: "Paczka replay jest zbyt duża.", code: "REPLAY_CHUNK_TOO_LARGE" });
      return;
    }

    let action = findReplayAction(room, actionId);
    if (!action) {
      if (seq !== 1 || room.authoritySide !== player.side) {
        res.status(409).json({ error: "Nie można rozpocząć tego replayu.", code: "INVALID_REPLAY_AUTHORITY" });
        return;
      }
      const timestamp = now();
      action = {
        id: actionId,
        actionNo: ++room.replayActionCounter,
        side: player.side,
        lastSeq: 0,
        final: false,
        chunks: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      room.replayActions.push(action);
      if (room.replayActions.length > MAX_REPLAY_ACTIONS) room.replayActions.shift();
    }

    if (action.side !== player.side) {
      res.status(409).json({ error: "Replay należy do drugiego gracza.", code: "REPLAY_SIDE_MISMATCH" });
      return;
    }
    if (seq !== action.lastSeq + 1) {
      res.status(409).json({ error: "Nieciągła sekwencja replay.", code: "REPLAY_SEQUENCE_GAP" });
      return;
    }
    if (action.chunks.length >= MAX_REPLAY_CHUNKS_PER_ACTION) {
      res.status(413).json({ error: "Replay jest zbyt długi.", code: "REPLAY_TOO_LONG" });
      return;
    }

    const timestamp = now();
    const chunk: ReplayChunk = {
      globalSeq: ++room.replayGlobalSeq,
      actionId,
      actionNo: action.actionNo,
      side: player.side,
      seq,
      final,
      frames,
      createdAt: timestamp,
    };
    action.lastSeq = seq;
    action.final = action.final || final;
    action.updatedAt = timestamp;
    action.chunks.push(chunk);
    touch(room, player);

    res.json({ ok: true, globalSeq: chunk.globalSeq, actionNo: action.actionNo });
  });

  router.get("/core-clash/rooms/:roomId/replay", (req, res) => {
    const room = rooms.get(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: "Nie znaleziono pokoju.", code: "ROOM_NOT_FOUND" });
      return;
    }
    const player = playerForToken(room, req.query["token"]);
    if (!player) {
      res.status(403).json({ error: "Nieprawidłowy token gracza.", code: "INVALID_PLAYER_TOKEN" });
      return;
    }
    touch(room, player);
    const afterRaw = Number(req.query["after"] ?? 0);
    const after = Number.isFinite(afterRaw) ? Math.max(0, Math.floor(afterRaw)) : 0;
    const chunks = room.replayActions
      .flatMap((action) => action.chunks)
      .filter((chunk) => chunk.globalSeq > after)
      .sort((a, b) => a.globalSeq - b.globalSeq)
      .slice(0, 32);
    res.json({
      chunks,
      replayGlobalSeq: room.replayGlobalSeq,
      latestReplaySide: latestReplay(room)?.side ?? null,
    });
  });

  router.post("/core-clash/rooms/:roomId/leave", (req, res) => {
    const room = rooms.get(req.params.roomId);
    if (!room) {
      res.json({ ok: true });
      return;
    }
    const player = playerForToken(room, req.body?.token);
    if (!player) {
      res.status(403).json({ error: "Nieprawidłowy token gracza.", code: "INVALID_PLAYER_TOKEN" });
      return;
    }

    if (room.matchmaking) {
      // Quick Match nie jest trwałym serwerem. Wyjście któregokolwiek gracza
      // kończy sesję, żeby drugi klient nie został z martwym pokojem.
      rooms.delete(room.id);
      res.json({ ok: true, roomClosed: true });
      return;
    }

    resetPublicRoomAfterLeave(room, player);
    res.json({ ok: true, roomClosed: !rooms.has(room.id) });
  });

  return router;
}

export default createCoreClashMultiplayerRouter();
