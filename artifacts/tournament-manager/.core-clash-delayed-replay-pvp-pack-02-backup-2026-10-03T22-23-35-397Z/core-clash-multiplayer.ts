import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";

type Side = "player" | "cpu";
type RoomStatus = "waiting" | "draft" | "playing" | "finished";

interface RoomPlayer {
  token: string;
  name: string;
  side: Side;
  ready: boolean;
  deck: string[] | null;
  lastSeenAt: number;
  lastClientSeq: number;
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
}

const rooms = new Map<string, CoreClashRoom>();
const ROOM_TTL_MS = 45 * 60 * 1_000;
const SNAPSHOT_MAX_APPROX_BYTES = 1_500_000;

function now(): number {
  return Date.now();
}

function cleanText(value: unknown, fallback: string, max = 32): string {
  const text = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  return (text || fallback).slice(0, max);
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
  const cutoff = now() - ROOM_TTL_MS;
  for (const [id, room] of rooms) {
    if (room.updatedAt < cutoff) rooms.delete(id);
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

function roomView(room: CoreClashRoom, includeDecks = false) {
  const mapPlayer = (player?: RoomPlayer) =>
    player
      ? {
          name: player.name,
          side: player.side,
          ready: player.ready,
          ...(includeDecks ? { deck: player.deck } : {}),
        }
      : null;

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

function createRoom(playerName: string, roomName: string, isPublic: boolean, matchmaking: boolean) {
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
  };

  const player: RoomPlayer = {
    token: randomUUID(),
    name: cleanText(playerName, "Gracz 1", 24),
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

function joinRoom(room: CoreClashRoom, playerName: string) {
  if (room.players.cpu) throw new Error("ROOM_FULL");
  const timestamp = now();
  const player: RoomPlayer = {
    token: randomUUID(),
    name: cleanText(playerName, "Gracz 2", 24),
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
    const playerName = cleanText(req.body?.playerName, "Gracz 1", 24);
    const roomName = cleanText(req.body?.roomName, `${playerName} — pokój`, 32);
    const created = createRoom(playerName, roomName, req.body?.public !== false, false);
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
      const player = joinRoom(room, cleanText(req.body?.playerName, "Gracz 2", 24));
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
    const playerName = cleanText(req.body?.playerName, "Gracz", 24);
    const open = [...rooms.values()]
      .filter(
        (room) =>
          room.matchmaking &&
          room.status === "waiting" &&
          playerCount(room) === 1,
      )
      .sort((a, b) => a.createdAt - b.createdAt)[0];

    if (open) {
      const player = joinRoom(open, playerName);
      res.json({
        room: roomView(open, true),
        token: player.token,
        side: player.side,
        version: open.version,
        matched: true,
      });
      return;
    }

    const created = createRoom(playerName, "Szybki mecz", false, true);
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

    if (room.status === "playing") {
      rooms.delete(room.id);
    } else if (player.side === "player") {
      const guest = room.players.cpu;
      if (guest) {
        guest.side = "player";
        guest.ready = false;
        guest.deck = null;
        room.players.player = guest;
        delete room.players.cpu;
        room.status = "waiting";
        room.snapshot = null;
        room.version = 0;
        room.authoritySide = "player";
        touch(room, guest);
      } else {
        rooms.delete(room.id);
      }
    } else {
      delete room.players.cpu;
      room.status = "waiting";
      room.snapshot = null;
      room.version = 0;
      room.authoritySide = "player";
      const host = room.players.player;
      if (host) {
        host.ready = false;
        host.deck = null;
      }
      touch(room, host);
    }

    res.json({ ok: true });
  });

  return router;
}

export default createCoreClashMultiplayerRouter();
