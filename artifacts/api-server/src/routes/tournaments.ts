import { Router, type IRouter } from "express";
import { eq, and, sql, inArray, desc, ne } from "drizzle-orm";
import { db, tournamentsTable, tournamentStagesTable, stageParticipantsTable, playersTable, matchesTable, resultHistoryTable, actionLogTable, supportSessionsTable, authAuditLogTable } from "@workspace/db";
import { hashPassword, verifyOrganizerToken } from "../auth";
import { logAuditAction } from "./auth";
import { requireOrganizer, requireTournamentRead, requireTournamentWrite } from "../access-policy";
import {
  completeMatch,
  CompleteMatchError,
  type CompleteMatchErrorCode,
} from "../application/matches/complete-match";
import {
  revertMatch,
  RevertMatchError,
  type RevertMatchErrorCode,
} from "../application/matches/revert-match";
import {
  completeStage,
  getQualificationPreview,
  startStage,
  StageLifecycleError,
  type StageLifecycleErrorCode,
} from "../application/stages/stage-lifecycle";
import {
  BackupV2ValidationError,
  importBackupV2,
} from "../application/backups/backup-v2";
import {
  BackupV3ValidationError,
  exportBackupV3,
  importBackupV3,
} from "../application/backups/backup-v3";
import {
  addPlayerWithStagePlanCompatibility,
  createTournamentWithStagePlan,
  TournamentStagePlanError,
} from "../application/stages/create-tournament-with-plan";
import {
  getTournamentStageDetails,
  listTournamentStages,
  serializeTournamentStage,
} from "../application/stages/stage-queries";
import { calculateMatchRecordStandings } from "../domain/tournament/standings";
import { generateRoundRobinSchedule } from "../domain/tournament/round-robin";
import { generateSwissPairings } from "../domain/tournament/swiss";
import { validatePlayedSeriesResult } from "../domain/match/series-result";
import {
  CreateTournamentBody,
  UpdateTournamentBody,
  GetTournamentParams,
  UpdateTournamentParams,
  DeleteTournamentParams,
  StartTournamentParams,
  GenerateNextRoundParams,
  GetTournamentBracketParams,
  GetTournamentStatsParams,
  GetTournamentStandingsParams,
  GetResultsHistoryParams,
  GetTournamentAssistantParams,
  ListPlayersParams,
  AddPlayerBody,
  AddPlayerParams,
  ImportPlayersParams,
  ImportPlayersBody,
  UpdatePlayerParams,
  UpdatePlayerBody,
  DeletePlayerParams,
  ListMatchesParams,
  GetMatchParams,
  UpdateMatchParams,
  UpdateMatchBody,
  CompleteMatchParams,
  CompleteMatchBody,
  RevertMatchParams,
  CancelMatchParams,
  CancelMatchBody,
  RestoreCancelledMatchParams,
  SwapMatchPlayersParams,
  ReorderMatchesParams,
  ReorderMatchesBody,
  GetActionLogParams,
  UndoLastActionParams,
  ExportTournamentParams,
  ImportTournamentBody,
  ListTournamentStagesParams,
  GetTournamentStageParams,
  PreviewStageQualificationParams,
  CompleteTournamentStageParams,
  StartTournamentStageParams,
  VerifyHostCodeParams,
  VerifyHostCodeBody,
  type TournamentBackupV2,
  type TournamentBackupV3,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ========== HELPERS ==========

function parseId(raw: unknown): number {
  const val = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(val as string, 10);
}

function parsePositiveInteger(raw: unknown): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function sendStageLifecycleError(
  error: StageLifecycleError,
  res: import("express").Response,
): void {
  const notFound = new Set<StageLifecycleErrorCode>(["TOURNAMENT_NOT_FOUND", "STAGE_NOT_FOUND"]);
  const conflict = new Set<StageLifecycleErrorCode>([
    "STAGE_NOT_ACTIVE",
    "STAGE_NOT_NEXT_PLANNED",
    "ACTIVE_STAGE_EXISTS",
    "PREVIOUS_STAGE_NOT_COMPLETED",
    "STAGE_ALREADY_COMPLETED",
    "STAGE_ALREADY_STARTED",
    "MATCHES_ALREADY_EXIST",
    "GROUPS_ALREADY_EXIST",
  ]);
  res.status(notFound.has(error.code) ? 404 : conflict.has(error.code) ? 409 : 422)
    .json({ error: error.message, code: error.code });
}

function formatDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString();
}

function mapTournament(t: typeof tournamentsTable.$inferSelect) {
  const {
    hostCode: _hostCode,
    organizerPasswordHash: _oph,
    supportPasswordHash: _sph,
    supportPasswordVersion: _spv,
    viewerPasswordHash: _vph,
    viewerPasswordVersion: _vpv,
    ...rest
  } = t;
  return {
    ...rest,
    createdAt: formatDate(t.createdAt) ?? new Date().toISOString(),
    maxPlayers: t.maxPlayers ?? null,
    swissRounds: t.swissRounds ?? null,
    resultModelVersion: t.resultModelVersion,
    rankingPolicy: t.rankingPolicy,
    defaultBestOf: t.defaultBestOf,
    currentRound: t.currentRound ?? null,
    totalRounds: t.totalRounds ?? null,
    winnerId: t.winnerId ?? null,
    featuredMatchId: t.featuredMatchId ?? null,
    hasHostCode: !!t.hostCode,
    hasOrganizerPassword: !!t.organizerPasswordHash,
    hasSupportPassword: !!t.supportPasswordHash,
    hasViewerPassword: !!t.viewerPasswordHash,
    visibility: t.visibility ?? "public_online",
  };
}

async function checkHostAuth(req: import("express").Request, res: import("express").Response, tournamentId: number): Promise<boolean> {
  const [t] = await db.select({
    hostCode: tournamentsTable.hostCode,
    organizerPasswordHash: tournamentsTable.organizerPasswordHash,
    supportPasswordHash: tournamentsTable.supportPasswordHash,
    supportPasswordVersion: tournamentsTable.supportPasswordVersion,
  }).from(tournamentsTable).where(eq(tournamentsTable.id, tournamentId));
  if (!t) { res.status(404).json({ error: "Turniej nie istnieje" }); return false; }

  // New-style auth: organizer token
  const orgToken = req.headers["x-organizer-token"] as string | undefined;
  if (orgToken) {
    const valid = verifyOrganizerToken(orgToken, tournamentId);
    if (valid) return true;
    res.status(403).json({ error: "Nieprawidłowy token organizatora" }); return false;
  }

  // New-style auth: support token
  const supToken = req.headers["x-support-token"] as string | undefined;
  if (supToken) {
    const [session] = await db.select().from(supportSessionsTable)
      .where(and(eq(supportSessionsTable.tournamentId, tournamentId), eq(supportSessionsTable.sessionToken, supToken)));
    if (!session) { res.status(403).json({ error: "Nieważna sesja wsparcia" }); return false; }
    if (session.passwordVersion !== (t.supportPasswordVersion ?? 0)) {
      res.status(403).json({ error: "Hasło wsparcia zostało zmienione. Zaloguj się ponownie." }); return false;
    }
    return true;
  }

  // Legacy host code
  if (!t.hostCode && !t.organizerPasswordHash) return true;
  if (t.organizerPasswordHash) {
    res.status(403).json({ error: "Wymagany token organizatora lub wsparcia" }); return false;
  }
  const provided = req.headers["x-host-code"];
  if (provided !== t.hostCode) { res.status(403).json({ error: "Nieprawidłowy kod prowadzącego" }); return false; }
  return true;
}

/** Like checkHostAuth but explicitly rejects support tokens — only organizers can delete/archive. */
async function checkOrganizerOnlyAuth(req: import("express").Request, res: import("express").Response, tournamentId: number): Promise<boolean> {
  const [t] = await db.select({
    hostCode: tournamentsTable.hostCode,
    organizerPasswordHash: tournamentsTable.organizerPasswordHash,
  }).from(tournamentsTable).where(eq(tournamentsTable.id, tournamentId));
  if (!t) { res.status(404).json({ error: "Turniej nie istnieje" }); return false; }

  // Organizer token — the only accepted credential for destructive actions
  const orgToken = req.headers["x-organizer-token"] as string | undefined;
  if (orgToken) {
    if (verifyOrganizerToken(orgToken, tournamentId)) return true;
    res.status(403).json({ error: "Nieprawidłowy token organizatora" }); return false;
  }

  // Explicitly reject support tokens — support staff cannot delete tournaments
  if (req.headers["x-support-token"]) {
    res.status(403).json({ error: "Wsparcie nie ma uprawnień do usuwania turniejów" }); return false;
  }

  // Legacy host code
  if (!t.hostCode && !t.organizerPasswordHash) {
    // Unprotected tournament — block unless host code in header (backward compat for test cleanup)
    return true;
  }
  if (t.organizerPasswordHash) {
    res.status(403).json({ error: "Wymagane hasło organizatora" }); return false;
  }
  const provided = req.headers["x-host-code"] as string | undefined;
  if (provided !== t.hostCode) { res.status(403).json({ error: "Nieprawidłowy kod prowadzącego" }); return false; }
  return true;
}

async function checkViewerReadAuth(req: import("express").Request, res: import("express").Response, tournamentId: number): Promise<boolean> {
  return (await requireTournamentRead(req, res, tournamentId)) !== null;
}

function mapPlayer(p: typeof playersTable.$inferSelect) {
  return {
    ...p,
    rank: p.rank ?? null,
    country: p.country ?? null,
    teamName: p.teamName ?? null,
    seed: p.seed ?? null,
    createdAt: formatDate(p.createdAt) ?? new Date().toISOString(),
  };
}

function mapMatch(
  m: typeof matchesTable.$inferSelect,
  player1Name?: string | null,
  player2Name?: string | null,
) {
  return {
    ...m,
    player1Id: m.player1Id ?? null,
    player2Id: m.player2Id ?? null,
    player1Name: player1Name ?? null,
    player2Name: player2Name ?? null,
    score1: m.score1 ?? null,
    score2: m.score2 ?? null,
    winnerId: m.winnerId ?? null,
    bestOf: m.bestOf,
    resultType: m.resultType ?? null,
    resultReason: m.resultReason ?? null,
    note: m.note ?? null,
    nextMatchId: m.nextMatchId ?? null,
    sortOrder: m.sortOrder ?? null,
    scheduledAt: formatDate(m.scheduledAt),
    completedAt: formatDate(m.completedAt),
  };
}

async function enrichMatches(matches: (typeof matchesTable.$inferSelect)[]) {
  if (matches.length === 0) return [];
  const playerIds = [
    ...new Set([
      ...matches.map((m) => m.player1Id).filter(Boolean),
      ...matches.map((m) => m.player2Id).filter(Boolean),
    ]),
  ] as number[];

  const players =
    playerIds.length > 0
      ? await db
          .select()
          .from(playersTable)
          .where(inArray(playersTable.id, playerIds))
      : [];
  const playerMap = new Map(players.map((p) => [p.id, p.name]));

  return matches.map((m) =>
    mapMatch(
      m,
      playerMap.get(m.player1Id!) ?? null,
      playerMap.get(m.player2Id!) ?? null,
    ),
  );
}

// ========== BRACKET GENERATION ==========

function nextPow2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(Math.max(n, 2))));
}

/**
 * Standard single-elimination bracket seeding positions.
 * Returns an array of seed ranks (1-indexed) in bracket slot order.
 * Guarantees: seeds 1 & 2 can only meet in the final, 1–4 in semis, etc.
 * Example (size=8): [1, 8, 5, 4, 3, 6, 7, 2] — no, correct is [1,8,4,5,2,7,3,6]
 * Algorithm: recursively interleave prev positions with their complements.
 */
function generateBracketPositions(size: number): number[] {
  if (size === 2) return [1, 2];
  const prev = generateBracketPositions(size / 2);
  const result: number[] = [];
  for (const seed of prev) {
    result.push(seed);
    result.push(size + 1 - seed);
  }
  return result;
}

function generateSingleElimination(
  players: (typeof playersTable.$inferSelect)[],
  tournamentId: number,
  defaultBestOf: number,
) {
  const seeded = [...players].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
  const n = seeded.length;
  const bracketSize = nextPow2(n);
  const totalRounds = Math.ceil(Math.log2(bracketSize));

  const matches: (typeof matchesTable.$inferInsert)[] = [];

  const positions = generateBracketPositions(bracketSize);

  const firstRoundCount = bracketSize / 2;
  for (let i = 0; i < firstRoundCount; i++) {
    const seed1 = positions[i * 2];
    const seed2 = positions[i * 2 + 1];
    const p1 = seeded[seed1 - 1] ?? null;
    const p2 = seeded[seed2 - 1] ?? null;
    const isBye = p1 && !p2;
    matches.push({
      tournamentId,
      round: 1,
      matchNumber: i + 1,
      player1Id: p1?.id ?? null,
      player2Id: p2?.id ?? null,
      bestOf: defaultBestOf,
      status: isBye ? "completed" : "pending",
      resultType: isBye ? "bye" : null,
      resultReason: isBye ? "system_bye" : null,
      winnerId: isBye ? p1!.id : null,
      completedAt: isBye ? new Date() : null,
    });
  }

  for (let r = 2; r <= totalRounds; r++) {
    const count = Math.pow(2, totalRounds - r);
    for (let i = 0; i < count; i++) {
      matches.push({
        tournamentId,
        round: r,
        matchNumber: i + 1,
        bestOf: defaultBestOf,
        status: "pending",
      });
    }
  }

  return { matches, totalRounds };
}

function generateRoundRobin(
  players: (typeof playersTable.$inferSelect)[],
  tournamentId: number,
  defaultBestOf: number,
) {
  const schedule = generateRoundRobinSchedule(players);
  const matches: (typeof matchesTable.$inferInsert)[] = schedule.map((pairing) => ({
    tournamentId,
    round: pairing.round,
    matchNumber: pairing.matchNumber,
    player1Id: pairing.player1Id,
    player2Id: pairing.player2Id,
    bestOf: defaultBestOf,
    status: "pending",
  }));
  return {
    matches,
    totalRounds: schedule.reduce((maximum, pairing) => Math.max(maximum, pairing.round), 1),
  };
}

function generateSwissRound(
  players: (typeof playersTable.$inferSelect)[],
  completedMatches: (typeof matchesTable.$inferSelect)[],
  tournamentId: number,
  roundIndex: number,
  defaultBestOf: number,
): (typeof matchesTable.$inferInsert)[] {
  const standings = calculateMatchRecordStandings(players, completedMatches, "swiss");
  const now = new Date();
  return generateSwissPairings({
    players,
    standings,
    previousMatches: completedMatches,
    round: roundIndex,
  }).map((pairing) => ({
    tournamentId,
    round: pairing.round,
    matchNumber: pairing.matchNumber,
    player1Id: pairing.player1Id,
    player2Id: pairing.player2Id,
    bestOf: defaultBestOf,
    status: pairing.resultType === "bye" ? "completed" : "pending",
    resultType: pairing.resultType,
    resultReason: pairing.resultType === "bye" ? "system_bye" : null,
    winnerId: pairing.resultType === "bye" ? pairing.player1Id : null,
    completedAt: pairing.resultType === "bye" ? now : null,
  }));
}

// ========== STANDINGS ==========

function calculateStandings(
  players: (typeof playersTable.$inferSelect)[],
  matches: (typeof matchesTable.$inferSelect)[],
  tournament: typeof tournamentsTable.$inferSelect,
) {
  return calculateMatchRecordStandings(players, matches, tournament.format);
}

// ========== CSV IMPORT ==========

function parseCsv(csv: string) {
  const lines = csv.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase());

  const results: Array<{
    name: string;
    rank?: string;
    seed?: number;
    teamName?: string;
    country?: string;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(sep).map((v) => v.trim());
    const get = (key: string, fallback = "") => {
      const idx = headers.indexOf(key);
      return idx >= 0 && idx < values.length ? values[idx] : fallback;
    };

    const nickIdx = headers.indexOf("nick") >= 0 ? headers.indexOf("nick") : headers.indexOf("name");
    const nick = nickIdx >= 0 ? values[nickIdx]?.trim() : "";
    if (!nick) continue;

    const seedStr = get("seed");
    const seed = seedStr ? parseInt(seedStr, 10) : undefined;

    results.push({
      name: nick,
      rank: get("ranga") || get("rank") || undefined,
      seed: seed && !isNaN(seed) ? seed : undefined,
      teamName: get("druzyna") || get("team") || undefined,
      country: get("kraj") || get("country") || undefined,
    });
  }
  return results;
}

// ========== TOURNAMENT ROUTES ==========

router.get("/tournaments", async (_req, res): Promise<void> => {
  const tournaments = await db
    .select()
    .from(tournamentsTable)
    .where(ne(tournamentsTable.visibility, "private_offline"))
    .orderBy(tournamentsTable.createdAt);
  res.json(tournaments.map(mapTournament));
});

router.post("/tournaments", async (req, res): Promise<void> => {
  if (req.body?.format === "double_elimination") {
    res.status(422).json({
      error: "Double elimination jest wyłączone do czasu osobnej, kompletnej implementacji.",
      code: "DOUBLE_ELIMINATION_UNAVAILABLE",
    });
    return;
  }
  const parsed = CreateTournamentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.defaultBestOf != null && (!Number.isInteger(parsed.data.defaultBestOf) || parsed.data.defaultBestOf % 2 === 0)) {
    res.status(422).json({ error: "defaultBestOf musi być dodatnią nieparzystą liczbą całkowitą.", code: "INVALID_DEFAULT_BEST_OF" });
    return;
  }
  const { organizerPassword, supportPassword, viewerPassword, stagePlan, ...rest } = parsed.data;
  const insertValues: any = { ...rest };
  if (organizerPassword) insertValues.organizerPasswordHash = await hashPassword(organizerPassword);
  if (supportPassword) insertValues.supportPasswordHash = await hashPassword(supportPassword);
  if (viewerPassword) insertValues.viewerPasswordHash = await hashPassword(viewerPassword);
  try {
    const tournament = await createTournamentWithStagePlan({ tournament: insertValues, stagePlan });
    res.status(201).json(mapTournament(tournament));
  } catch (error) {
    if (error instanceof TournamentStagePlanError) {
      res.status(422).json({ error: error.message, code: "INVALID_STAGE_PLAN", details: error.problems });
      return;
    }
    throw error;
  }
});

router.get("/tournaments/:id", async (req, res): Promise<void> => {
  const params = GetTournamentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const access = await requireTournamentRead(req, res, params.data.id);
  if (!access) return;
  res.json(mapTournament(access.tournament));
});

router.get("/tournaments/:id/stages", async (req, res): Promise<void> => {
  const params = ListTournamentStagesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireTournamentRead(req, res, params.data.id)) return;
  res.json(await listTournamentStages(params.data.id));
});

router.get("/tournaments/:id/stages/:stageId", async (req, res): Promise<void> => {
  const params = GetTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireTournamentRead(req, res, params.data.id)) return;
  try {
    res.json(await getTournamentStageDetails({ tournamentId: params.data.id, stageId: params.data.stageId }));
  } catch (error) {
    if (error instanceof StageLifecycleError) { sendStageLifecycleError(error, res); return; }
    throw error;
  }
});

router.get("/tournaments/:id/stages/:stageId/qualification-preview", async (req, res): Promise<void> => {
  const params = PreviewStageQualificationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireTournamentRead(req, res, params.data.id)) return;
  try {
    res.json(await getQualificationPreview({ tournamentId: params.data.id, stageId: params.data.stageId }));
  } catch (error) {
    if (error instanceof StageLifecycleError) {
      sendStageLifecycleError(error, res);
      return;
    }
    throw error;
  }
});

router.post("/tournaments/:id/stages/:stageId/complete", async (req, res): Promise<void> => {
  const params = CompleteTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireOrganizer(req, res, params.data.id)) return;
  try {
    res.json(await completeStage({ tournamentId: params.data.id, stageId: params.data.stageId }));
  } catch (error) {
    if (error instanceof StageLifecycleError) {
      sendStageLifecycleError(error, res);
      return;
    }
    throw error;
  }
});

router.post("/tournaments/:id/stages/:stageId/start", async (req, res): Promise<void> => {
  const params = StartTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireOrganizer(req, res, params.data.id)) return;
  try {
    res.json(serializeTournamentStage(await startStage({ tournamentId: params.data.id, stageId: params.data.stageId })));
  } catch (error) {
    if (error instanceof StageLifecycleError) {
      sendStageLifecycleError(error, res);
      return;
    }
    throw error;
  }
});

router.patch("/tournaments/:id", async (req, res): Promise<void> => {
  const params = UpdateTournamentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  if (req.body?.format === "double_elimination") {
    res.status(422).json({ error: "Double elimination jest obecnie niedostępne.", code: "DOUBLE_ELIMINATION_UNAVAILABLE" });
    return;
  }
  const parsed = UpdateTournamentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.defaultBestOf != null && (!Number.isInteger(parsed.data.defaultBestOf) || parsed.data.defaultBestOf % 2 === 0)) {
    res.status(422).json({ error: "defaultBestOf musi być dodatnią nieparzystą liczbą całkowitą.", code: "INVALID_DEFAULT_BEST_OF" });
    return;
  }
  if (!await checkHostAuth(req, res, params.data.id)) return;
  const [prevT] = await db.select().from(tournamentsTable).where(eq(tournamentsTable.id, params.data.id));
  const [t] = await db
    .update(tournamentsTable)
    .set(parsed.data)
    .where(eq(tournamentsTable.id, params.data.id))
    .returning();
  if (!t) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }
  // Log featured match changes
  if (prevT && "featuredMatchId" in (parsed.data as object)) {
    const newFeatured = (parsed.data as any).featuredMatchId ?? null;
    if (newFeatured !== prevT.featuredMatchId) {
      if (newFeatured) {
        const [fm] = await db.select().from(matchesTable).where(eq(matchesTable.id, newFeatured));
        await logAction({ tournamentId: t.id, actionType: "match_featured", description: `Wyróżniono mecz R${fm?.round}M${fm?.matchNumber}`, matchId: newFeatured, undoPayload: { type: "restore_featured", prevFeaturedMatchId: prevT.featuredMatchId } });
      } else {
        await logAction({ tournamentId: t.id, actionType: "match_unfeatured", description: "Zdjęto wyróżnienie meczu", undoPayload: { type: "restore_featured", prevFeaturedMatchId: prevT.featuredMatchId } });
      }
    }
  }
  res.json(mapTournament(t));
});

router.delete("/tournaments/:id", async (req, res): Promise<void> => {
  const params = DeleteTournamentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  if (!await checkOrganizerOnlyAuth(req, res, params.data.id)) return;
  await db.delete(tournamentsTable).where(eq(tournamentsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/tournaments/:id/verify-host-code", async (req, res): Promise<void> => {
  const params = VerifyHostCodeParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = VerifyHostCodeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [t] = await db.select({ hostCode: tournamentsTable.hostCode }).from(tournamentsTable).where(eq(tournamentsTable.id, params.data.id));
  if (!t) { res.status(404).json({ error: "Turniej nie istnieje" }); return; }

  if (!t.hostCode) {
    res.json({ valid: true });
    return;
  }
  if (parsed.data.code === t.hostCode) {
    res.json({ valid: true });
    return;
  }
  res.status(403).json({ valid: false, error: "Nieprawidłowy kod prowadzącego" });
});

router.post("/tournaments/:id/start", async (req, res): Promise<void> => {
  const params = StartTournamentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [tournament] = await db
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, params.data.id));
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }
  if (!await checkHostAuth(req, res, tournament.id)) return;
  try {
    const updated = await db.transaction(async (tx) => {
      const [lockedTournament] = await tx
        .select()
        .from(tournamentsTable)
        .where(eq(tournamentsTable.id, params.data.id))
        .for("update");
      if (!lockedTournament) throw new Error("TOURNAMENT_NOT_FOUND");
      if (lockedTournament.status !== "draft") throw new Error("TOURNAMENT_ALREADY_STARTED");

      const stages = await tx
        .select()
        .from(tournamentStagesTable)
        .where(eq(tournamentStagesTable.tournamentId, lockedTournament.id))
        .orderBy(tournamentStagesTable.position)
        .for("update");
      if (stages.length !== 1 || stages[0].status !== "planned") {
        throw new Error("SINGLE_STAGE_COMPATIBILITY_REQUIRED");
      }
      const stage = stages[0];
      if (stage.format === "group_stage") throw new Error("STAGE_FORMAT_NOT_SUPPORTED");

      const players = await tx
        .select()
        .from(playersTable)
        .where(eq(playersTable.tournamentId, lockedTournament.id))
        .orderBy(playersTable.id)
        .for("update");
      if (players.length < 2) throw new Error("NOT_ENOUGH_PLAYERS");
      const memberships = await tx
        .select()
        .from(stageParticipantsTable)
        .where(eq(stageParticipantsTable.stageId, stage.id))
        .orderBy(stageParticipantsTable.stageSeed)
        .for("update");
      const playersById = new Map(players.map((player) => [player.id, player]));
      if (
        memberships.length !== players.length ||
        memberships.some((membership) => !playersById.has(membership.playerId))
      ) {
        throw new Error("STAGE_PARTICIPANTS_INCONSISTENT");
      }
      const stagePlayers = memberships.map((membership) => ({
        ...playersById.get(membership.playerId)!,
        seed: membership.stageSeed,
      }));

      await tx.delete(matchesTable).where(eq(matchesTable.stageId, stage.id));

      const bestOf = stage.bestOf;
      let generatedMatches: (typeof matchesTable.$inferInsert)[];
      let totalRounds: number;
      if (stage.format === "round_robin") {
        const generated = generateRoundRobin(stagePlayers, lockedTournament.id, bestOf);
        generatedMatches = generated.matches;
        totalRounds = generated.totalRounds;
      } else if (stage.format === "swiss") {
        totalRounds = stage.plannedRounds ?? Math.ceil(Math.log2(stagePlayers.length));
        generatedMatches = generateSwissRound(stagePlayers, [], lockedTournament.id, 1, bestOf);
      } else {
        const generated = generateSingleElimination(stagePlayers, lockedTournament.id, bestOf);
        generatedMatches = generated.matches;
        totalRounds = generated.totalRounds;
      }

      const inserted = await tx
        .insert(matchesTable)
        .values(generatedMatches.map((match) => ({ ...match, stageId: stage.id })))
        .returning();
      const byeMatches = inserted.filter((match) => match.resultType === "bye" && match.winnerId);

      // Single-elimination bye advances structurally but is not a match win.
      if (stage.format === "single_elimination") {
        for (const byeMatch of byeMatches) {
          const round2Matches = inserted
            .filter((match) => match.round === 2)
            .sort((a, b) => a.matchNumber - b.matchNumber);
          const targetMatch = round2Matches[Math.floor((byeMatch.matchNumber - 1) / 2)];
          if (targetMatch) {
            const isPlayer1 = (byeMatch.matchNumber - 1) % 2 === 0;
            await tx
              .update(matchesTable)
              .set(isPlayer1 ? { player1Id: byeMatch.winnerId } : { player2Id: byeMatch.winnerId })
              .where(eq(matchesTable.id, targetMatch.id));
          }
        }
      }

      for (const byeMatch of byeMatches) {
        await tx.insert(resultHistoryTable).values({
          matchId: byeMatch.id,
          tournamentId: byeMatch.tournamentId,
          stageId: stage.id,
          revision: 1,
          round: byeMatch.round,
          matchNumber: byeMatch.matchNumber,
          player1Id: byeMatch.player1Id,
          player2Id: null,
          score1: null,
          score2: null,
          winnerId: byeMatch.winnerId,
          bestOf: byeMatch.bestOf,
          resultType: "bye",
          resultReason: "system_bye",
          completedAt: byeMatch.completedAt!,
        });
        await tx.insert(actionLogTable).values({
          tournamentId: byeMatch.tournamentId,
          stageId: stage.id,
          actionType: "system_bye_assigned",
          description: `Systemowy bye R${byeMatch.round}M${byeMatch.matchNumber}`,
          matchId: byeMatch.id,
          undoPayload: null,
          isUndone: false,
        });
      }

      const now = new Date();
      await tx
        .update(tournamentStagesTable)
        .set({
          status: "active",
          participantCount: players.length,
          currentRound: 1,
          totalRounds,
          startedAt: now,
          completedAt: null,
          winnerId: null,
          version: stage.version + 1,
        })
        .where(eq(tournamentStagesTable.id, stage.id));

      const swissRounds = stage.format === "swiss" ? totalRounds : undefined;
      const [savedTournament] = await tx
        .update(tournamentsTable)
        .set({
          status: "active",
          currentRound: 1,
          totalRounds,
          ...(stage.format === "swiss" ? { swissRounds } : {}),
        })
        .where(eq(tournamentsTable.id, lockedTournament.id))
        .returning();
      await tx.insert(actionLogTable).values({
        tournamentId: lockedTournament.id,
        stageId: stage.id,
        actionType: "tournament_started",
        description: `Turniej wystartował: ${players.length} graczy, ${totalRounds} rund (${stage.format})`,
        matchId: null,
        undoPayload: null,
        isUndone: false,
      });
      return savedTournament;
    });
    res.json(mapTournament(updated));
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const messages: Record<string, string> = {
      TOURNAMENT_NOT_FOUND: "Tournament not found",
      TOURNAMENT_ALREADY_STARTED: "Tournament already started",
      SINGLE_STAGE_COMPATIBILITY_REQUIRED: "Tournament stage plan is not supported by this operation",
      STAGE_FORMAT_NOT_SUPPORTED: "Tournament stage format is not supported by this operation",
      NOT_ENOUGH_PLAYERS: "Need at least 2 players to start",
      STAGE_PARTICIPANTS_INCONSISTENT: "Tournament stage participants are inconsistent",
    };
    res.status(code === "TOURNAMENT_NOT_FOUND" ? 404 : 400).json({
      error: messages[code] ?? "Could not start tournament",
    });
  }
});

router.post("/tournaments/:id/generate-round", async (req, res): Promise<void> => {
  const params = GenerateNextRoundParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const access = await requireTournamentWrite(req, res, params.data.id);
  if (!access) return;

  try {
    const updated = await db.transaction(async (tx) => {
      const [tournament] = await tx
        .select()
        .from(tournamentsTable)
        .where(eq(tournamentsTable.id, params.data.id))
        .for("update");
      if (!tournament) throw new Error("TOURNAMENT_NOT_FOUND");
      if (tournament.status !== "active") throw new Error("TOURNAMENT_NOT_ACTIVE");

      const [stage] = await tx
        .select()
        .from(tournamentStagesTable)
        .where(
          and(
            eq(tournamentStagesTable.tournamentId, tournament.id),
            eq(tournamentStagesTable.status, "active"),
          ),
        )
        .for("update");
      if (!stage) throw new Error("ACTIVE_STAGE_NOT_FOUND");
      if (stage.format !== "swiss") throw new Error("NOT_SWISS");

      const currentRound = stage.currentRound ?? 1;
      const maxRounds = stage.plannedRounds ?? stage.totalRounds ?? 1;
      const currentMatches = await tx
        .select()
        .from(matchesTable)
        .where(
          and(
            eq(matchesTable.stageId, stage.id),
            eq(matchesTable.round, currentRound),
          ),
        )
        .orderBy(matchesTable.matchNumber)
        .for("update");
      if (currentMatches.length === 0 || currentMatches.some((match) => match.status !== "completed")) {
        throw new Error("ROUND_NOT_COMPLETE");
      }
      if (currentRound >= maxRounds) throw new Error("ALL_ROUNDS_GENERATED");

      const nextRound = currentRound + 1;
      const existingNextRound = await tx
        .select({ id: matchesTable.id })
        .from(matchesTable)
        .where(
          and(
            eq(matchesTable.stageId, stage.id),
            eq(matchesTable.round, nextRound),
          ),
        );
      if (existingNextRound.length > 0) throw new Error("ROUND_ALREADY_GENERATED");

      const players = await tx
        .select()
        .from(playersTable)
        .where(eq(playersTable.tournamentId, tournament.id));
      const memberships = await tx
        .select()
        .from(stageParticipantsTable)
        .where(eq(stageParticipantsTable.stageId, stage.id))
        .orderBy(stageParticipantsTable.stageSeed)
        .for("update");
      const playersById = new Map(players.map((player) => [player.id, player]));
      if (memberships.some((membership) => !playersById.has(membership.playerId))) {
        throw new Error("STAGE_PARTICIPANTS_INCONSISTENT");
      }
      const stagePlayers = memberships.map((membership) => ({
        ...playersById.get(membership.playerId)!,
        seed: membership.stageSeed,
      }));
      const allMatches = await tx
        .select()
        .from(matchesTable)
        .where(eq(matchesTable.stageId, stage.id));
      const generated = generateSwissRound(
        stagePlayers,
        allMatches,
        tournament.id,
        nextRound,
        stage.bestOf,
      );
      const inserted = await tx
        .insert(matchesTable)
        .values(generated.map((match) => ({ ...match, stageId: stage.id })))
        .returning();
      for (const byeMatch of inserted.filter((match) => match.resultType === "bye")) {
        await tx.insert(resultHistoryTable).values({
          matchId: byeMatch.id,
          tournamentId: byeMatch.tournamentId,
          stageId: stage.id,
          revision: 1,
          round: byeMatch.round,
          matchNumber: byeMatch.matchNumber,
          player1Id: byeMatch.player1Id,
          player2Id: null,
          score1: null,
          score2: null,
          winnerId: byeMatch.winnerId,
          bestOf: byeMatch.bestOf,
          resultType: "bye",
          resultReason: "system_bye",
          completedAt: byeMatch.completedAt!,
        });
        await tx.insert(actionLogTable).values({
          tournamentId: tournament.id,
          stageId: stage.id,
          actionType: "system_bye_assigned",
          description: `Systemowy bye R${byeMatch.round}M${byeMatch.matchNumber}`,
          matchId: byeMatch.id,
          undoPayload: null,
          isUndone: false,
        });
      }

      const [saved] = await tx
        .update(tournamentsTable)
        .set({ currentRound: nextRound })
        .where(eq(tournamentsTable.id, tournament.id))
        .returning();
      await tx
        .update(tournamentStagesTable)
        .set({ currentRound: nextRound, version: stage.version + 1 })
        .where(eq(tournamentStagesTable.id, stage.id));
      return saved;
    });
    res.json(mapTournament(updated));
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status = code === "TOURNAMENT_NOT_FOUND" ? 404 : 409;
    const messages: Record<string, string> = {
      TOURNAMENT_NOT_FOUND: "Tournament not found",
      NOT_SWISS: "Only Swiss format supports round generation",
      TOURNAMENT_NOT_ACTIVE: "Tournament not active",
      ACTIVE_STAGE_NOT_FOUND: "Active tournament stage not found",
      STAGE_PARTICIPANTS_INCONSISTENT: "Tournament stage participants are inconsistent",
      ROUND_NOT_COMPLETE: "All matches in the current round must have final results",
      ALL_ROUNDS_GENERATED: "All Swiss rounds already generated",
      ROUND_ALREADY_GENERATED: "The next Swiss round already exists",
    };
    res.status(status).json({ error: messages[code] ?? "Could not generate Swiss round", code });
  }
});

router.get("/tournaments/:id/bracket", async (req, res): Promise<void> => {
  const params = GetTournamentBracketParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await checkViewerReadAuth(req, res, params.data.id)) return;

  const [tournament] = await db
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, params.data.id));
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }

  const matches = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.tournamentId, params.data.id))
    .orderBy(matchesTable.round, matchesTable.matchNumber);

  const enriched = await enrichMatches(matches);

  const roundNumbers = [
    ...new Set(enriched.map((m) => m.round)),
  ].sort((a, b) => a - b);
  const rounds = roundNumbers.map((round) => ({
    round,
    matches: enriched.filter((m) => m.round === round),
  }));

  let winner = null;
  if (tournament.winnerId) {
    const [wp] = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.id, tournament.winnerId));
    if (wp) winner = { id: wp.id, name: wp.name };
  }

  res.json({ tournament: mapTournament(tournament), rounds, winner });
});

router.get("/tournaments/:id/stats", async (req, res): Promise<void> => {
  const params = GetTournamentStatsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await checkViewerReadAuth(req, res, params.data.id)) return;

  const [tournament] = await db
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, params.data.id));
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }

  const players = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.tournamentId, params.data.id));
  const matches = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.tournamentId, params.data.id));

  const completedMatches = matches.filter((m) => m.status === "completed").length;
  const pendingMatches = matches.filter((m) => m.status === "pending" || m.status === "postponed").length;
  const inProgressMatches = matches.filter((m) => m.status === "in_progress").length;

  const topPlayers = calculateStandings(players, matches, tournament)
    .slice(0, 5)
    .map((standing) => ({
      id: standing.playerId,
      name: standing.playerName,
      matchWins: standing.matchWins,
      matchLosses: standing.matchLosses,
      gameDiff: standing.gameDiff,
    }));

  res.json({
    totalPlayers: players.length,
    totalMatches: matches.length,
    completedMatches,
    pendingMatches,
    inProgressMatches,
    currentRound: tournament.currentRound ?? null,
    totalRounds: tournament.totalRounds ?? null,
    topPlayers,
  });
});

router.get("/tournaments/:id/standings", async (req, res): Promise<void> => {
  const params = GetTournamentStandingsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await checkViewerReadAuth(req, res, params.data.id)) return;

  const [tournament] = await db
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, params.data.id));
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }

  const players = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.tournamentId, params.data.id));
  const matches = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.tournamentId, params.data.id));

  const standings = calculateStandings(players, matches, tournament);
  res.json(standings);
});

router.get("/tournaments/:id/results-history", async (req, res): Promise<void> => {
  const params = GetResultsHistoryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await checkViewerReadAuth(req, res, params.data.id)) return;

  const history = await db
    .select()
    .from(resultHistoryTable)
    .where(eq(resultHistoryTable.tournamentId, params.data.id))
    .orderBy(desc(resultHistoryTable.completedAt));

  // Enrich with player names
  const playerIds = [
    ...new Set([
      ...history.map((h) => h.player1Id).filter(Boolean),
      ...history.map((h) => h.player2Id).filter(Boolean),
      ...history.map((h) => h.winnerId).filter(Boolean),
    ]),
  ] as number[];
  const players =
    playerIds.length > 0
      ? await db
          .select()
          .from(playersTable)
          .where(inArray(playersTable.id, playerIds))
      : [];
  const playerMap = new Map(players.map((p) => [p.id, p.name]));

  res.json(
    history.map((h) => ({
      id: h.id,
      matchId: h.matchId,
      round: h.round,
      matchNumber: h.matchNumber,
      player1Name: h.player1Id ? (playerMap.get(h.player1Id) ?? null) : null,
      player2Name: h.player2Id ? (playerMap.get(h.player2Id) ?? null) : null,
      score1: h.score1 ?? null,
      score2: h.score2 ?? null,
      winnerId: h.winnerId ?? null,
      winnerName: h.winnerId ? (playerMap.get(h.winnerId) ?? null) : null,
      bestOf: h.bestOf,
      resultType: h.resultType,
      resultReason: h.resultReason ?? null,
      revision: h.revision,
      completedAt: formatDate(h.completedAt) ?? new Date().toISOString(),
      recordedAt: formatDate(h.recordedAt) ?? new Date().toISOString(),
    })),
  );
});

router.get("/tournaments/:id/assistant", async (req, res): Promise<void> => {
  const params = GetTournamentAssistantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const access = await requireTournamentRead(req, res, params.data.id);
  if (!access) return;
  const tournament = access.tournament;

  const players = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.tournamentId, params.data.id));
  const matches = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.tournamentId, params.data.id));

  const warnings: string[] = [];
  let stepTitle = "";
  let nextAction = "";

  if (tournament.status === "draft") {
    if (players.length === 0) {
      stepTitle = "Krok 1/5: Dodaj zawodnikow";
      nextAction = "Dodaj zawodnikow recznie lub wczytaj CSV. Wymagane minimum: 2.";
    } else if (players.length < 2) {
      stepTitle = "Krok 1/5: Wczytaj zawodnikow";
      nextAction = `Dodaj jeszcze ${2 - players.length} zawodnika aby mozna bylo wystartowac.`;
    } else {
      stepTitle = "Krok 2/5: Sprawdz zawodnikow i start";
      nextAction = `Masz ${players.length} zawodnikow. Sprawdz rozstawienie i kliknij Start.`;
      const unseeded = players.filter((p) => !p.seed);
      if (unseeded.length > 0) {
        warnings.push(`${unseeded.length} zawodnikow bez rozstawienia.`);
      }
    }
  } else if (tournament.status === "active") {
    const pending = matches.filter((m) => m.status === "pending" || m.status === "postponed");
    const live = matches.filter((m) => m.status === "in_progress");
    const done = matches.filter((m) => m.status === "completed");

    if (live.length > 0) {
      stepTitle = "Krok 4/5: Mecz w toku";
      nextAction = `${live.length} mecz(e) aktualnie grane. Wpisz wynik.`;
    } else if (pending.length > 0) {
      stepTitle = "Krok 3/5: Wpisuj wyniki";
      nextAction = `${pending.length} mecz(e) oczekuje. Wybierz mecz i wpisz wynik.`;
    } else {
      if (tournament.format === "swiss" && (tournament.currentRound ?? 0) < (tournament.totalRounds ?? 0)) {
        stepTitle = "Krok 4/5: Generuj nastepna runde";
        nextAction = `Runda ${tournament.currentRound} zakonczona. Wygeneruj runde ${(tournament.currentRound ?? 0) + 1}.`;
      } else {
        stepTitle = "Krok 5/5: Zakonczenie";
        nextAction = "Wszystkie mecze zakonczone. Mozesz zakonczyc turniej lub sprawdzic tabele.";
      }
    }

    if (done.length > 0 && pending.length > 0) {
      const progress = Math.round((done.length / matches.length) * 100);
      warnings.push(`Postep rundy: ${progress}%`);
    }
  } else {
    stepTitle = "Turniej zakonczony";
    nextAction = "Sprawdz tabele koncową i exportuj wyniki.";
  }

  res.json({ stepTitle, nextAction, warnings });
});

// ========== PLAYER ROUTES ==========

router.get("/tournaments/:id/players", async (req, res): Promise<void> => {
  const params = ListPlayersParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await checkViewerReadAuth(req, res, params.data.id)) return;
  const players = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.tournamentId, params.data.id))
    .orderBy(playersTable.seed, playersTable.createdAt);
  res.json(players.map(mapPlayer));
});

router.post("/tournaments/:id/players", async (req, res): Promise<void> => {
  const params = AddPlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = AddPlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!await checkHostAuth(req, res, params.data.id)) return;

  // Duplicate name check (case-insensitive, trimmed)
  const trimmedName = parsed.data.name.trim();
  const existing = await db
    .select({ name: playersTable.name })
    .from(playersTable)
    .where(eq(playersTable.tournamentId, params.data.id));
  const duplicate = existing.find((p) => p.name.trim().toLowerCase() === trimmedName.toLowerCase());
  if (duplicate) {
    res.status(409).json({ error: `Zawodnik o nicku „${duplicate.name}" już istnieje w tym turnieju. Nicki muszą być unikalne (bez względu na wielkość liter).`, code: "DUPLICATE_PLAYER_NAME" });
    return;
  }

  const player = await addPlayerWithStagePlanCompatibility({
    tournamentId: params.data.id,
    ...parsed.data,
    name: trimmedName,
  });
  await logAction({
    tournamentId: params.data.id,
    actionType: "player_added",
    description: `Dodano gracza: ${player.name}${parsed.data.seed ? ` (seed ${parsed.data.seed})` : ""}`,
    undoPayload: { type: "delete_player", playerId: player.id },
  });
  res.status(201).json(mapPlayer(player));
});

router.post("/tournaments/:id/players/import", async (req, res): Promise<void> => {
  const params = ImportPlayersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = ImportPlayersBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [tournament] = await db
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, params.data.id));
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }
  if (!await checkHostAuth(req, res, tournament.id)) return;
  if (tournament.status !== "draft") {
    res.status(400).json({ error: "Cannot import players after tournament has started" });
    return;
  }

  const mode = (parsed.data as any).mode === "replace" ? "replace" : "append";

  // Get existing players
  const existingPlayers = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.tournamentId, params.data.id));

  const existingNames = new Set(existingPlayers.map((p) => p.name.toLowerCase()));
  const replacedCount = mode === "replace" ? existingPlayers.length : 0;

  // Parse CSV with line numbers
  type CsvRow = { name: string; rank?: string; seed?: number; teamName?: string; country?: string };
  const rawLines = parsed.data.csv.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const sep = rawLines[0]?.includes(";") ? ";" : ",";
  const headers = rawLines[0]?.split(sep).map((h) => h.trim().toLowerCase()) ?? [];

  type RowError = { line: number; content: string; reason: string };
  const errors: RowError[] = [];
  const validRows: Array<CsvRow & { lineNum: number }> = [];
  const seenNamesInCsv = new Set<string>();

  for (let i = 1; i < rawLines.length; i++) {
    const raw = rawLines[i];
    if (!raw.trim()) continue;
    const lineNum = i + 1;
    const values = raw.split(sep).map((v) => v.trim());
    const get = (key: string) => {
      const idx = headers.indexOf(key);
      return idx >= 0 && idx < values.length ? values[idx] : "";
    };

    // name is required (support "name" and "nick")
    const nameIdx = headers.indexOf("name") >= 0 ? headers.indexOf("name") : headers.indexOf("nick");
    const name = nameIdx >= 0 ? values[nameIdx]?.trim() ?? "" : "";

    if (!name) {
      errors.push({ line: lineNum, content: raw, reason: "Brak nazwy zawodnika (kolumna 'name' jest wymagana)" });
      continue;
    }
    if (name.length > 100) {
      errors.push({ line: lineNum, content: raw, reason: `Nazwa jest za długa (${name.length} znaków, max 100)` });
      continue;
    }

    // Duplicate within CSV
    const nameLower = name.toLowerCase();
    if (seenNamesInCsv.has(nameLower)) {
      errors.push({ line: lineNum, content: raw, reason: `Duplikat w pliku CSV: "${name}" już występuje wcześniej` });
      continue;
    }
    seenNamesInCsv.add(nameLower);

    // Duplicate against existing players (only in append mode)
    if (mode === "append" && existingNames.has(nameLower)) {
      errors.push({ line: lineNum, content: raw, reason: `Zawodnik "${name}" jest już na liście turnieju` });
      continue;
    }

    // Validate seed
    const seedStr = get("seed");
    let seed: number | undefined;
    if (seedStr) {
      const parsed = parseInt(seedStr, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 999) {
        errors.push({ line: lineNum, content: raw, reason: `Nieprawidłowe rozstawienie (seed): "${seedStr}" — musi być liczbą 1–999` });
        continue;
      }
      seed = parsed;
    }

    validRows.push({
      lineNum,
      name,
      rank: get("rank") || get("ranga") || undefined,
      seed,
      teamName: get("team") || get("druzyna") || undefined,
      country: get("country") || get("kraj") || undefined,
    });
  }

  // Limit check
  const currentCount = mode === "replace" ? 0 : existingPlayers.length;
  const limit = tournament.maxPlayers ?? 256;
  const available = limit - currentCount;
  let limitExceeded = false;

  let rowsToInsert = validRows;
  if (validRows.length > available) {
    // Mark the overflow rows as errors
    const overflow = validRows.splice(available);
    overflow.forEach((r) => {
      errors.push({ line: r.lineNum, content: r.name, reason: `Limit graczy turnieju (${limit}) został osiągnięty — gracz pominięty` });
    });
    limitExceeded = true;
    rowsToInsert = validRows;
  }

  // Apply import in a transaction-like sequence
  if (mode === "replace" && existingPlayers.length > 0) {
    await db
      .delete(playersTable)
      .where(eq(playersTable.tournamentId, params.data.id));
  }

  let inserted: typeof existingPlayers = [];
  if (rowsToInsert.length > 0) {
    inserted = await db
      .insert(playersTable)
      .values(
        rowsToInsert.map((r) => ({
          tournamentId: params.data.id,
          name: r.name,
          rank: r.rank ?? null,
          seed: r.seed ?? null,
          teamName: r.teamName ?? null,
          country: r.country ?? null,
        })),
      )
      .returning();
  }

  const totalCsvDataRows = rawLines.filter((l) => l.trim()).length - 1; // minus header
  const skipped = errors.length;

  res.json({
    imported: inserted.length,
    skipped,
    replacedCount: mode === "replace" ? replacedCount : undefined,
    limitExceeded,
    players: inserted.map(mapPlayer),
    errors,
  });
});

router.patch("/players/:id", async (req, res): Promise<void> => {
  const params = UpdatePlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db.select().from(playersTable).where(eq(playersTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  if (!await checkHostAuth(req, res, existing.tournamentId)) return;
  const [player] = await db
    .update(playersTable)
    .set(parsed.data)
    .where(eq(playersTable.id, params.data.id))
    .returning();
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  await logAction({
    tournamentId: existing.tournamentId,
    actionType: "player_edited",
    description: `Edytowano gracza: ${existing.name} → ${player.name}`,
    undoPayload: { type: "restore_player", playerId: player.id, prevData: { name: existing.name, seed: existing.seed, rank: existing.rank, country: existing.country, teamName: existing.teamName } },
  });
  res.json(mapPlayer(player));
});

router.delete("/players/:id", async (req, res): Promise<void> => {
  const params = DeletePlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [toDelete] = await db.select().from(playersTable).where(eq(playersTable.id, params.data.id));
  if (toDelete && !await checkHostAuth(req, res, toDelete.tournamentId)) return;
  await db.delete(playersTable).where(eq(playersTable.id, params.data.id));
  if (toDelete) {
    await logAction({
      tournamentId: toDelete.tournamentId,
      actionType: "player_removed",
      description: `Usunięto gracza: ${toDelete.name}`,
    });
  }
  res.sendStatus(204);
});

// ========== ACTION LOG HELPERS ==========

const UNDOABLE_TYPES = new Set([
  "match_started", "match_postponed", "match_restored",
  "match_bo_changed", "match_featured", "match_unfeatured",
  "match_result_submitted", "player_added", "player_edited",
  "match_cancelled", "match_players_swapped",
]);

async function logAction(params: {
  tournamentId: number;
  actionType: string;
  description: string;
  matchId?: number | null;
  undoPayload?: Record<string, unknown> | null;
}) {
  await db.insert(actionLogTable).values({
    tournamentId: params.tournamentId,
    actionType: params.actionType,
    description: params.description,
    matchId: params.matchId ?? null,
    undoPayload: params.undoPayload ? JSON.stringify(params.undoPayload) : null,
    isUndone: false,
  });
}

function mapActionLog(entry: typeof actionLogTable.$inferSelect) {
  return {
    id: entry.id,
    tournamentId: entry.tournamentId,
    actionType: entry.actionType,
    description: entry.description,
    matchId: entry.matchId ?? null,
    canUndo: UNDOABLE_TYPES.has(entry.actionType) && !entry.isUndone && !!entry.undoPayload,
    isUndone: entry.isUndone,
    createdAt: entry.createdAt.toISOString(),
  };
}

function sendRevertMatchError(
  error: RevertMatchError,
  res: import("express").Response,
): void {
  const notFoundCodes = new Set<RevertMatchErrorCode>([
    "MATCH_NOT_FOUND",
    "TOURNAMENT_NOT_FOUND",
    "PARTICIPANT_NOT_FOUND",
  ]);
  const conflictCodes = new Set<RevertMatchErrorCode>([
    "MATCH_NOT_COMPLETED",
    "COMPLETION_ALREADY_UNDONE",
    "UNDO_ACTION_CHANGED",
    "DOWNSTREAM_BLOCKED",
    "STAGE_ALREADY_ADVANCED",
    "CONCURRENT_MODIFICATION",
    "SYSTEM_BYE_REVERT_BLOCKED",
  ]);
  const status = notFoundCodes.has(error.code)
    ? 404
    : conflictCodes.has(error.code)
      ? 409
      : 422;
  res.status(status).json({ error: error.message, code: error.code });
}

// ========== ACTION LOG ROUTES ==========

router.get("/tournaments/:id/action-log", async (req, res): Promise<void> => {
  const params = GetActionLogParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  if (!await requireTournamentRead(req, res, params.data.id)) return;
  const entries = await db
    .select()
    .from(actionLogTable)
    .where(eq(actionLogTable.tournamentId, params.data.id))
    .orderBy(desc(actionLogTable.createdAt))
    .limit(50);
  res.json(entries.map(mapActionLog));
});

router.post("/tournaments/:id/undo-last", async (req, res): Promise<void> => {
  const params = UndoLastActionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  if (!await requireTournamentWrite(req, res, params.data.id)) return;

  // Find the last undoable, non-undone action
  const [lastAction] = await db
    .select()
    .from(actionLogTable)
    .where(
      and(
        eq(actionLogTable.tournamentId, params.data.id),
        eq(actionLogTable.isUndone, false),
        sql`${actionLogTable.undoPayload} IS NOT NULL`,
      ),
    )
    .orderBy(desc(actionLogTable.createdAt), desc(actionLogTable.id))
    .limit(1);

  if (!lastAction || !lastAction.undoPayload) {
    const [latestAction] = await db
      .select({ actionType: actionLogTable.actionType })
      .from(actionLogTable)
      .where(eq(actionLogTable.tournamentId, params.data.id))
      .orderBy(desc(actionLogTable.createdAt), desc(actionLogTable.id))
      .limit(1);
    if (latestAction?.actionType === "match_result_reverted") {
      sendRevertMatchError(new RevertMatchError("MATCH_NOT_COMPLETED"), res);
      return;
    }
    res.status(404).json({ error: "Brak akcji do cofnięcia" });
    return;
  }

  const payload = JSON.parse(lastAction.undoPayload) as Record<string, unknown>;

  try {
    switch (payload.type) {
      case "revert_match": {
        const matchId = payload.matchId as number;
        if (!Number.isInteger(matchId) || matchId < 1) {
          throw new RevertMatchError("COMPLETION_LOG_AMBIGUOUS");
        }
        const result = await revertMatch({
          matchId,
          expectedTournamentId: params.data.id,
          expectedCompletionActionId: lastAction.id,
        });
        res.json({
          action: mapActionLog(result.completionAction),
          message: `Cofnięto: ${lastAction.description}`,
        });
        return;
      }
      case "restore_status": {
        const matchId = payload.matchId as number;
        const prevStatus = payload.prevStatus as string;
        await db.update(matchesTable).set({ status: prevStatus as any }).where(eq(matchesTable.id, matchId));
        await logAction({ tournamentId: params.data.id, actionType: "match_result_reverted", description: `Cofnięto status meczu (przywrócono: ${prevStatus})`, matchId });
        break;
      }
      case "restore_best_of": {
        const matchId = payload.matchId as number;
        const prevBestOf = payload.prevBestOf as number;
        await db.update(matchesTable).set({ bestOf: prevBestOf }).where(eq(matchesTable.id, matchId));
        await logAction({ tournamentId: params.data.id, actionType: "match_result_reverted", description: `Cofnięto zmianę BO (przywrócono: BO${prevBestOf})`, matchId });
        break;
      }
      case "restore_featured": {
        const prevFeaturedMatchId = (payload.prevFeaturedMatchId as number) ?? null;
        await db.update(tournamentsTable).set({ featuredMatchId: prevFeaturedMatchId }).where(eq(tournamentsTable.id, params.data.id));
        await logAction({ tournamentId: params.data.id, actionType: "match_result_reverted", description: "Cofnięto zmianę wyróżnionego meczu" });
        break;
      }
      case "delete_player": {
        const playerId = payload.playerId as number;
        await db.delete(playersTable).where(eq(playersTable.id, playerId));
        await logAction({ tournamentId: params.data.id, actionType: "player_removed", description: `Cofnięto dodanie gracza (usunięto ID ${playerId})` });
        break;
      }
      case "restore_player": {
        const playerId = payload.playerId as number;
        const prevData = payload.prevData as Record<string, unknown>;
        await db.update(playersTable).set(prevData as any).where(eq(playersTable.id, playerId));
        await logAction({ tournamentId: params.data.id, actionType: "player_edited", description: `Cofnięto edycję gracza — przywrócono poprzednie dane` });
        break;
      }
      case "restore_cancelled_match": {
        const matchId = payload.matchId as number;
        const prevStatus = payload.prevStatus as string;
        const prevNote = (payload.prevNote as string | null) ?? null;
        await db.update(matchesTable).set({ status: prevStatus as any, note: prevNote }).where(eq(matchesTable.id, matchId));
        await logAction({ tournamentId: params.data.id, actionType: "match_restored", description: `Cofnięto anulowanie meczu (przywrócono status: ${prevStatus})`, matchId });
        break;
      }
      case "restore_players_swap": {
        const matchId = payload.matchId as number;
        await db.update(matchesTable).set({
          player1Id: (payload.player1Id as number | null) ?? null,
          player2Id: (payload.player2Id as number | null) ?? null,
          score1: (payload.score1 as number | null) ?? null,
          score2: (payload.score2 as number | null) ?? null,
        }).where(eq(matchesTable.id, matchId));
        await logAction({ tournamentId: params.data.id, actionType: "match_result_reverted", description: `Cofnięto zamianę zawodników w meczu ID ${matchId}`, matchId });
        break;
      }
      default:
        res.status(400).json({ error: `Nie można cofnąć akcji: ${payload.type}` });
        return;
    }

    // Mark as undone
    await db.update(actionLogTable).set({ isUndone: true }).where(eq(actionLogTable.id, lastAction.id));

    const [updated] = await db.select().from(actionLogTable).where(eq(actionLogTable.id, lastAction.id));
    res.json({ action: mapActionLog(updated!), message: `Cofnięto: ${lastAction.description}` });
  } catch (err) {
    if (err instanceof RevertMatchError) {
      sendRevertMatchError(err, res);
      return;
    }
    res.status(500).json({ error: "Błąd podczas cofania akcji" });
  }
});

// ========== MATCH ROUTES ==========

router.get("/tournaments/:id/matches", async (req, res): Promise<void> => {
  const params = ListMatchesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await checkViewerReadAuth(req, res, params.data.id)) return;
  const matches = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.tournamentId, params.data.id))
    .orderBy(matchesTable.round, matchesTable.matchNumber);
  const enriched = await enrichMatches(matches);
  res.json(enriched);
});

router.get("/matches/:id", async (req, res): Promise<void> => {
  const params = GetMatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [match] = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.id, params.data.id));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  if (!await requireTournamentRead(req, res, match.tournamentId)) return;
  const [enriched] = await enrichMatches([match]);
  res.json(enriched);
});

router.patch("/matches/:id", async (req, res): Promise<void> => {
  const params = UpdateMatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const rawBody = req.body && typeof req.body === "object"
    ? req.body as Record<string, unknown>
    : {};
  const forbiddenResultFields = [
    "score1",
    "score2",
    "winnerId",
    "resultType",
    "resultReason",
    "completedAt",
  ].filter((field) =>
    Object.prototype.hasOwnProperty.call(rawBody, field),
  );
  if (forbiddenResultFields.length > 0) {
    res.status(422).json({
      error: "Końcowy wynik i zwycięzca mogą zostać zapisani wyłącznie przez CompleteMatch.",
      code: "MATCH_RESULT_REQUIRES_COMPLETE",
    });
    return;
  }
  if (rawBody.status === "completed") {
    res.status(422).json({
      error: "Ten status wymaga dedykowanego przypadku użycia.",
      code: "MATCH_FINAL_STATUS_REQUIRES_DEDICATED_ACTION",
    });
    return;
  }

  const parsed = UpdateMatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  // Read previous state before update for logging
  const [prevMatch] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.id));
  if (!prevMatch) { res.status(404).json({ error: "Match not found" }); return; }
  if (!await checkHostAuth(req, res, prevMatch.tournamentId)) return;

  if (
    prevMatch.status === "completed" &&
    (parsed.data.status != null || parsed.data.bestOf != null)
  ) {
    res.status(422).json({
      error: "Rozstrzygniętego meczu nie można zmieniać przez ogólny PATCH.",
      code: "FINALIZED_MATCH_PATCH_FORBIDDEN",
    });
    return;
  }
  if (parsed.data.bestOf != null) {
    if (!Number.isInteger(parsed.data.bestOf) || parsed.data.bestOf <= 0 || parsed.data.bestOf % 2 === 0) {
      res.status(422).json({
        error: "bestOf musi być dodatnią, nieparzystą liczbą całkowitą.",
        code: "INVALID_BEST_OF",
      });
      return;
    }
    if (prevMatch.status !== "pending") {
      res.status(422).json({
        error: "bestOf można zmienić tylko przed rozpoczęciem meczu.",
        code: "BEST_OF_CHANGE_NOT_ALLOWED",
      });
      return;
    }
  }
  const updateCondition = parsed.data.bestOf != null
    ? and(
      eq(matchesTable.id, params.data.id),
      eq(matchesTable.status, "pending"),
    )
    : parsed.data.status != null
      ? and(
        eq(matchesTable.id, params.data.id),
        ne(matchesTable.status, "completed"),
      )
      : eq(matchesTable.id, params.data.id);
  const [match] = await db
    .update(matchesTable)
    .set(parsed.data)
    .where(updateCondition)
    .returning();
  if (!match) {
    const [currentMatch] = await db
      .select({ id: matchesTable.id })
      .from(matchesTable)
      .where(eq(matchesTable.id, params.data.id));
    if (!currentMatch) {
      res.status(404).json({ error: "Match not found" });
      return;
    }
    res.status(422).json({
      error: "Stan meczu zmienił się i PATCH nie może zostać bezpiecznie zastosowany.",
      code: "MATCH_STATE_CHANGED",
    });
    return;
  }
  // Log status changes
  if (prevMatch && parsed.data.status && parsed.data.status !== prevMatch.status) {
    const p1 = prevMatch.player1Id; const p2 = prevMatch.player2Id;
    const [players] = p1 && p2 ? [await db.select().from(playersTable).where(inArray(playersTable.id, [p1, p2]))] : [[]];
    const playerMap = new Map((players as any[]).map((p: any) => [p.id, p.name]));
    const matchLabel = `R${prevMatch.round}M${prevMatch.matchNumber}: ${playerMap.get(p1 ?? 0) ?? "TBD"} vs ${playerMap.get(p2 ?? 0) ?? "TBD"}`;
    if (parsed.data.status === "in_progress") {
      await logAction({ tournamentId: match.tournamentId, actionType: "match_started", description: `Rozpoczęto mecz ${matchLabel}`, matchId: match.id, undoPayload: { type: "restore_status", matchId: match.id, prevStatus: prevMatch.status } });
    } else if (parsed.data.status === "postponed") {
      await logAction({ tournamentId: match.tournamentId, actionType: "match_postponed", description: `Przełożono mecz ${matchLabel}`, matchId: match.id, undoPayload: { type: "restore_status", matchId: match.id, prevStatus: prevMatch.status } });
    } else if (parsed.data.status === "pending" && prevMatch.status === "postponed") {
      await logAction({ tournamentId: match.tournamentId, actionType: "match_restored", description: `Przywrócono mecz ${matchLabel}`, matchId: match.id, undoPayload: { type: "restore_status", matchId: match.id, prevStatus: "postponed" } });
    }
  }
  // Log BO changes
  if (prevMatch && parsed.data.bestOf != null && parsed.data.bestOf !== prevMatch.bestOf) {
    await logAction({ tournamentId: match.tournamentId, actionType: "match_bo_changed", description: `Zmieniono format meczu R${match.round}M${match.matchNumber}: BO${prevMatch.bestOf ?? 1} → BO${match.bestOf}`, matchId: match.id, undoPayload: { type: "restore_best_of", matchId: match.id, prevBestOf: prevMatch.bestOf ?? 1 } });
  }
  const [enriched] = await enrichMatches([match]);
  res.json(enriched);
});

router.post("/matches/:id/complete", async (req, res): Promise<void> => {
  const params = CompleteMatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = CompleteMatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: parsed.error.message, code: "INVALID_MATCH_RESULT" });
    return;
  }

  const [matchReference] = await db
    .select({ tournamentId: matchesTable.tournamentId })
    .from(matchesTable)
    .where(eq(matchesTable.id, params.data.id));
  if (!matchReference) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  if (!await requireTournamentWrite(req, res, matchReference.tournamentId)) return;

  try {
    const updatedMatch = await completeMatch({ matchId: params.data.id, ...parsed.data });
    const [enriched] = await enrichMatches([updatedMatch]);
    res.json(enriched);
  } catch (error) {
    if (error instanceof CompleteMatchError) {
      const notFoundCodes = new Set<CompleteMatchErrorCode>([
        "MATCH_NOT_FOUND",
        "TOURNAMENT_NOT_FOUND",
        "PARTICIPANT_NOT_FOUND",
      ]);
      const status = error.code === "MATCH_ALREADY_FINALIZED"
        ? 409
        : notFoundCodes.has(error.code)
          ? 404
          : 422;
      res.status(status).json({ error: error.message, code: error.code });
      return;
    }
    res.status(500).json({ error: "Nie udało się zakończyć meczu." });
  }
});

router.post("/matches/:id/revert", async (req, res): Promise<void> => {
  const params = RevertMatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [matchReference] = await db
    .select({ tournamentId: matchesTable.tournamentId })
    .from(matchesTable)
    .where(eq(matchesTable.id, params.data.id));
  if (!matchReference) {
    res.status(404).json({ error: "Mecz nie istnieje.", code: "MATCH_NOT_FOUND" });
    return;
  }
  if (!await requireTournamentWrite(req, res, matchReference.tournamentId)) return;

  try {
    const result = await revertMatch({
      matchId: params.data.id,
      expectedTournamentId: matchReference.tournamentId,
    });
    const [enriched] = await enrichMatches([result.match]);
    res.json(enriched);
  } catch (error) {
    if (error instanceof RevertMatchError) {
      sendRevertMatchError(error, res);
      return;
    }
    res.status(500).json({ error: "Nie udało się cofnąć wyniku meczu." });
  }
});

// ===== CANCEL MATCH =====
router.post("/matches/:id/cancel", async (req, res): Promise<void> => {
  const params = CancelMatchParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = CancelMatchBody.safeParse(req.body ?? {});
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.id));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  if (!await checkHostAuth(req, res, match.tournamentId)) return;
  const blockedStatuses = ["completed", "cancelled"];
  if (blockedStatuses.includes(match.status)) {
    res.status(400).json({ error: `Nie można anulować meczu o statusie: ${match.status}` });
    return;
  }
  const p1Ids = [match.player1Id, match.player2Id].filter(Boolean) as number[];
  const namePlayers = p1Ids.length > 0 ? await db.select().from(playersTable).where(inArray(playersTable.id, p1Ids)) : [];
  const nm = new Map(namePlayers.map((p) => [p.id, p.name]));
  const matchLabel = `R${match.round}M${match.matchNumber}: ${nm.get(match.player1Id ?? 0) ?? "TBD"} vs ${nm.get(match.player2Id ?? 0) ?? "TBD"}`;
  const [updated] = await db.update(matchesTable).set({
    status: "cancelled",
    note: parsed.data.note ?? match.note ?? null,
  }).where(eq(matchesTable.id, params.data.id)).returning();
  await logAction({
    tournamentId: match.tournamentId,
    actionType: "match_cancelled",
    description: `Anulowano mecz ${matchLabel}`,
    matchId: match.id,
    undoPayload: {
      type: "restore_cancelled_match",
      matchId: match.id,
      prevStatus: match.status,
      prevNote: match.note,
    },
  });
  const [enriched] = await enrichMatches([updated]);
  res.json(enriched);
});

// ===== RESTORE CANCELLED MATCH =====
router.post("/matches/:id/restore-cancelled", async (req, res): Promise<void> => {
  const params = RestoreCancelledMatchParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.id));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  if (!await checkHostAuth(req, res, match.tournamentId)) return;
  if (match.status !== "cancelled") { res.status(400).json({ error: "Mecz nie jest anulowany" }); return; }
  const [updated] = await db.update(matchesTable).set({ status: "pending" }).where(eq(matchesTable.id, params.data.id)).returning();
  const p1Ids = [match.player1Id, match.player2Id].filter(Boolean) as number[];
  const namePlayers = p1Ids.length > 0 ? await db.select().from(playersTable).where(inArray(playersTable.id, p1Ids)) : [];
  const nm = new Map(namePlayers.map((p) => [p.id, p.name]));
  const matchLabel = `R${match.round}M${match.matchNumber}: ${nm.get(match.player1Id ?? 0) ?? "TBD"} vs ${nm.get(match.player2Id ?? 0) ?? "TBD"}`;
  await logAction({
    tournamentId: match.tournamentId,
    actionType: "match_restored",
    description: `Przywrócono anulowany mecz ${matchLabel}`,
    matchId: match.id,
    undoPayload: { type: "restore_status", matchId: match.id, prevStatus: "cancelled" },
  });
  const [enriched] = await enrichMatches([updated]);
  res.json(enriched);
});

// ===== SWAP PLAYERS =====
router.post("/matches/:id/swap-players", async (req, res): Promise<void> => {
  const params = SwapMatchPlayersParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.id));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  if (!await checkHostAuth(req, res, match.tournamentId)) return;
  const blockedStatuses = ["completed"];
  if (blockedStatuses.includes(match.status)) {
    res.status(400).json({ error: `Nie można zamieniać zawodników w meczu o statusie: ${match.status}` });
    return;
  }
  const [updated] = await db.update(matchesTable).set({
    player1Id: match.player2Id ?? null,
    player2Id: match.player1Id ?? null,
    score1: match.score2 ?? null,
    score2: match.score1 ?? null,
  }).where(eq(matchesTable.id, params.data.id)).returning();
  const p1Ids = [match.player1Id, match.player2Id].filter(Boolean) as number[];
  const namePlayers = p1Ids.length > 0 ? await db.select().from(playersTable).where(inArray(playersTable.id, p1Ids)) : [];
  const nm = new Map(namePlayers.map((p) => [p.id, p.name]));
  const p1n = nm.get(match.player1Id ?? 0) ?? "TBD";
  const p2n = nm.get(match.player2Id ?? 0) ?? "TBD";
  await logAction({
    tournamentId: match.tournamentId,
    actionType: "match_players_swapped",
    description: `Zamieniono strony w R${match.round}M${match.matchNumber}: ${p1n} ↔ ${p2n}`,
    matchId: match.id,
    undoPayload: {
      type: "restore_players_swap",
      matchId: match.id,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      score1: match.score1,
      score2: match.score2,
    },
  });
  const [enriched] = await enrichMatches([updated]);
  res.json(enriched);
});

// ===== REORDER MATCHES =====
router.post("/tournaments/:id/reorder-matches", async (req, res): Promise<void> => {
  const params = ReorderMatchesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = ReorderMatchesBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  if (!await checkHostAuth(req, res, params.data.id)) return;
  const { matchIds } = parsed.data;
  // Assign sortOrder based on position in provided array
  await Promise.all(
    matchIds.map((matchId, idx) =>
      db.update(matchesTable)
        .set({ sortOrder: (idx + 1) * 10 })
        .where(and(eq(matchesTable.id, matchId), eq(matchesTable.tournamentId, params.data.id))),
    ),
  );
  const all = await db.select().from(matchesTable).where(eq(matchesTable.tournamentId, params.data.id)).orderBy(matchesTable.round, matchesTable.matchNumber);
  const enriched = await enrichMatches(all);
  res.json(enriched);
});

// ===== EXPORT =====
router.get("/tournaments/:id/export", async (req, res): Promise<void> => {
  const params = ExportTournamentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const tid = params.data.id;

  const access = await requireOrganizer(req, res, tid);
  if (!access) return;
  res.json(await exportBackupV3(tid));
});

// ===== IMPORT =====
router.post("/tournaments/import", async (req, res): Promise<void> => {
  const rawBody = req.body && typeof req.body === "object"
    ? req.body as Record<string, unknown>
    : {};
  if (rawBody.version === "1" || rawBody.schemaVersion === 1) {
    res.status(400).json({
      error: "Nieobsługiwany format legacy backupu v1. Wymagany jest backup series_v1/v2 albo v3.",
      code: "LEGACY_BACKUP_UNSUPPORTED",
    });
    return;
  }
  const parsed = ImportTournamentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Nieprawidłowy backup v2/v3.", code: "INVALID_BACKUP" });
    return;
  }
  const parsedBackup = parsed.data;

  if (parsedBackup.schemaVersion !== 2 && parsedBackup.schemaVersion !== 3) {
    res.status(400).json({ error: `Nieobsługiwana wersja backupu (${parsedBackup.schemaVersion}). Wymagany jest format v2 albo v3.`, code: "BACKUP_VERSION_UNSUPPORTED" });
    return;
  }

  try {
    const imported = parsedBackup.schemaVersion === 2
      ? await importBackupV2(parsedBackup as TournamentBackupV2)
      : await importBackupV3(parsedBackup as TournamentBackupV3);
    res.status(201).json({
      tournament: mapTournament(imported.tournament),
      playersImported: imported.playersImported,
      matchesImported: imported.matchesImported,
    });
  } catch (error) {
    if (error instanceof BackupV3ValidationError) {
      res.status(400).json({
        error: "Backup v3 nie przeszedł pełnej walidacji.",
        code: "INVALID_BACKUP_V3",
        details: error.details,
      });
      return;
    }
    if (error instanceof BackupV2ValidationError) {
      res.status(400).json({
        error: "Backup v2 nie przeszedł pełnej walidacji.",
        code: "INVALID_BACKUP_V2",
        details: error.details,
      });
      return;
    }
    res.status(400).json({
      error: "Import backupu został wycofany; nie zapisano częściowych danych.",
      code: "BACKUP_IMPORT_ROLLED_BACK",
    });
  }

});

export default router;
