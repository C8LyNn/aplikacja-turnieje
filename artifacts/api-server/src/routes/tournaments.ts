import { Router, type IRouter } from "express";
import { eq, and, sql, inArray, desc, ne } from "drizzle-orm";
import { db, tournamentsTable, tournamentStagesTable, stageParticipantsTable, playersTable, matchesTable, resultHistoryTable, actionLogTable, authAuditLogTable } from "@workspace/db";
import {
  hashPassword,
  signVersionedOrganizerToken,
} from "../auth";
import { logAuditAction } from "./auth";
import { NEW_CREDENTIAL_MIN_LENGTH } from "../application/auth/credential-rate-limit";
import {
  getTournamentMutationActor,
  revalidateTournamentMutationActor,
  requireOrganizer,
  requireTournamentRead,
  requireTournamentWrite,
  TournamentMutationAuthorizationError,
  withTournamentMutationLock,
} from "../access-policy";
import {
  normalizeOrganizerPassword,
  organizerPasswordInputError,
  ORGANIZER_PASSWORD_TOO_SHORT_CODE,
} from "../validation/organizer-password";
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
  getStageStartReadiness,
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
  createTournamentWithStagePlan,
  TournamentStagePlanError,
} from "../application/stages/create-tournament-with-plan";
import {
  getTournamentStageDetails,
  listTournamentStages,
  serializeTournamentStage,
} from "../application/stages/stage-queries";
import {
  getSeedingCeremony,
  prepareSeedingCeremony,
  resetSeedingCeremony,
  revealAllSeedingDraws,
  revealNextSeedingDraw,
  SeedingCeremonyError,
  type SeedingCeremonyErrorCode,
} from "../application/stages/seeding-ceremony";
import { calculateMatchRecordStandings } from "../domain/tournament/standings";
import { generateRoundRobinSchedule } from "../domain/tournament/round-robin";
import { generateSwissPairings } from "../domain/tournament/swiss";
import { buildStandardSeededBracket } from "../domain/tournament/stage-placement";
import { validatePlayedSeriesResult } from "../domain/match/series-result";
import {
  addTournamentPlayer,
  deleteTournamentPlayer,
  importTournamentPlayers,
  TournamentRosterError,
  undoTournamentRosterAction,
  updateTournamentPlayer,
} from "../application/players/tournament-roster";
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
    "SEEDING_CEREMONY_REQUIRED",
    "SEEDING_CEREMONY_INCOMPLETE",
    "SEEDING_CEREMONY_STALE",
  ]);
  res.status(notFound.has(error.code) ? 404 : conflict.has(error.code) ? 409 : 422)
    .json({ error: error.message, code: error.code });
}

function sendSeedingCeremonyError(
  error: SeedingCeremonyError,
  res: import("express").Response,
): void {
  const notFound = new Set<SeedingCeremonyErrorCode>(["TOURNAMENT_NOT_FOUND", "STAGE_NOT_FOUND"]);
  const conflict = new Set<SeedingCeremonyErrorCode>([
    "STAGE_NOT_PLANNED",
    "SEEDING_CEREMONY_NOT_PREPARED",
    "SEEDING_CEREMONY_ALREADY_COMPLETE",
    "SEEDING_CEREMONY_STALE",
    "MATCHES_ALREADY_EXIST",
    "GROUPS_ALREADY_EXIST",
  ]);
  res.status(notFound.has(error.code) ? 404 : conflict.has(error.code) ? 409 : 422)
    .json({ error: error.message, code: error.code });
}

function sendTournamentRosterError(
  error: TournamentRosterError,
  res: import("express").Response,
): void {
  const status = error.code === "TOURNAMENT_NOT_FOUND" || error.code === "PLAYER_NOT_FOUND"
    ? 404
    : error.code === "ROSTER_LOCKED" || error.code === "DUPLICATE_PLAYER_NAME"
      ? 409
      : 422;
  res.status(status).json({ error: error.message, code: error.code });
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

function generateSingleElimination(
  players: (typeof playersTable.$inferSelect)[],
  tournamentId: number,
  defaultBestOf: number,
) {
  const ordered = [...players].sort((left, right) =>
    (left.seed ?? Number.MAX_SAFE_INTEGER) - (right.seed ?? Number.MAX_SAFE_INTEGER) ||
    left.createdAt.getTime() - right.createdAt.getTime() ||
    left.id - right.id,
  );
  const playerByKey = new Map(ordered.map((player) => [String(player.id), player]));
  const bracket = buildStandardSeededBracket(
    ordered.map((player, index) => ({ participantKey: String(player.id), seed: index + 1 })),
  );
  const totalRounds = Math.ceil(Math.log2(bracket.bracketSize));
  const matches: (typeof matchesTable.$inferInsert)[] = [];
  const now = new Date();

  for (const pairing of bracket.firstRound) {
    const player1 = pairing.player1.participant == null
      ? null
      : playerByKey.get(pairing.player1.participant.participantKey) ?? null;
    const player2 = pairing.player2.participant == null
      ? null
      : playerByKey.get(pairing.player2.participant.participantKey) ?? null;
    const byeWinner = pairing.byeWinner == null
      ? null
      : playerByKey.get(pairing.byeWinner.participantKey) ?? null;
    matches.push({
      tournamentId,
      round: 1,
      matchNumber: pairing.matchNumber,
      player1Id: player1?.id ?? null,
      player2Id: player2?.id ?? null,
      bestOf: defaultBestOf,
      status: byeWinner == null ? "pending" : "completed",
      resultType: byeWinner == null ? null : "bye",
      resultReason: byeWinner == null ? null : "system_bye",
      winnerId: byeWinner?.id ?? null,
      completedAt: byeWinner == null ? null : now,
    });
  }

  for (let round = 2; round <= totalRounds; round += 1) {
    const count = 2 ** (totalRounds - round);
    for (let index = 0; index < count; index += 1) {
      matches.push({
        tournamentId,
        round,
        matchNumber: index + 1,
        player1Id: null,
        player2Id: null,
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
  if (Object.prototype.hasOwnProperty.call(req.body ?? {}, "hostCode")) {
    res.status(422).json({
      error: "hostCode jest historycznym poświadczeniem i nie może być ustawiany dla nowego turnieju.",
      code: "HOST_CODE_LEGACY_ONLY",
    });
    return;
  }
  if (req.body?.format === "double_elimination") {
    res.status(422).json({
      error: "Double elimination jest wyłączone do czasu osobnej, kompletnej implementacji.",
      code: "DOUBLE_ELIMINATION_UNAVAILABLE",
    });
    return;
  }
  const organizerPasswordError = organizerPasswordInputError(req.body?.organizerPassword);
  if (organizerPasswordError) {
    res.status(400).json({
      error: organizerPasswordError,
      code: ORGANIZER_PASSWORD_TOO_SHORT_CODE,
    });
    return;
  }
  const requestBody = req.body?.organizerPassword === ""
    ? { ...req.body, organizerPassword: undefined }
    : req.body;
  const parsed = CreateTournamentBody.safeParse(requestBody);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.defaultBestOf != null && (!Number.isInteger(parsed.data.defaultBestOf) || parsed.data.defaultBestOf % 2 === 0)) {
    res.status(422).json({ error: "defaultBestOf musi być dodatnią nieparzystą liczbą całkowitą.", code: "INVALID_DEFAULT_BEST_OF" });
    return;
  }
  const { organizerPassword: rawOrganizerPassword, supportPassword, viewerPassword, stagePlan, ...rest } = parsed.data;
  const organizerPassword = normalizeOrganizerPassword(rawOrganizerPassword);
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

router.get("/tournaments/:id/stages/:stageId/readiness", async (req, res): Promise<void> => {
  const params = GetTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireTournamentRead(req, res, params.data.id)) return;
  try {
    res.json(await getStageStartReadiness({
      tournamentId: params.data.id,
      stageId: params.data.stageId,
    }));
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

router.get("/tournaments/:id/stages/:stageId/seeding-ceremony", async (req, res): Promise<void> => {
  const params = GetTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireTournamentRead(req, res, params.data.id)) return;
  try {
    res.json({ ceremony: await getSeedingCeremony({ tournamentId: params.data.id, stageId: params.data.stageId }) });
  } catch (error) {
    if (error instanceof SeedingCeremonyError) { sendSeedingCeremonyError(error, res); return; }
    throw error;
  }
});

router.post("/tournaments/:id/stages/:stageId/seeding-ceremony/prepare", async (req, res): Promise<void> => {
  const params = StartTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireOrganizer(req, res, params.data.id)) return;
  try {
    res.json({ ceremony: await prepareSeedingCeremony({ tournamentId: params.data.id, stageId: params.data.stageId }) });
  } catch (error) {
    if (error instanceof SeedingCeremonyError) { sendSeedingCeremonyError(error, res); return; }
    throw error;
  }
});

router.post("/tournaments/:id/stages/:stageId/seeding-ceremony/reveal-next", async (req, res): Promise<void> => {
  const params = StartTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireOrganizer(req, res, params.data.id)) return;
  try {
    res.json({ ceremony: await revealNextSeedingDraw({ tournamentId: params.data.id, stageId: params.data.stageId }) });
  } catch (error) {
    if (error instanceof SeedingCeremonyError) { sendSeedingCeremonyError(error, res); return; }
    throw error;
  }
});

router.post("/tournaments/:id/stages/:stageId/seeding-ceremony/reveal-all", async (req, res): Promise<void> => {
  const params = StartTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireOrganizer(req, res, params.data.id)) return;
  try {
    res.json({ ceremony: await revealAllSeedingDraws({ tournamentId: params.data.id, stageId: params.data.stageId }) });
  } catch (error) {
    if (error instanceof SeedingCeremonyError) { sendSeedingCeremonyError(error, res); return; }
    throw error;
  }
});

router.delete("/tournaments/:id/stages/:stageId/seeding-ceremony", async (req, res): Promise<void> => {
  const params = StartTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireOrganizer(req, res, params.data.id)) return;
  try {
    await resetSeedingCeremony({ tournamentId: params.data.id, stageId: params.data.stageId });
    res.status(204).send();
  } catch (error) {
    if (error instanceof SeedingCeremonyError) { sendSeedingCeremonyError(error, res); return; }
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
  const changedFields = Object.keys(parsed.data);
  const onlyOperationalFields =
    changedFields.length > 0 &&
    changedFields.every((field) => field === "featuredMatchId");
  const access = onlyOperationalFields
    ? await requireTournamentWrite(req, res, params.data.id)
    : await requireOrganizer(req, res, params.data.id);
  if (!access) return;
  if (Object.prototype.hasOwnProperty.call(req.body ?? {}, "hostCode")) {
    res.status(422).json({
      error: "hostCode można wykorzystać wyłącznie w dedykowanej operacji upgrade'u historycznych poświadczeń.",
      code: "HOST_CODE_LEGACY_ONLY",
    });
    return;
  }
  if (changedFields.includes("visibility") || changedFields.includes("viewerPassword")) {
    res.status(422).json({
      error: "Widoczność i hasło widza można zmienić wyłącznie przez dedykowaną operację bezpieczeństwa.",
      code: "VISIBILITY_CHANGE_REQUIRES_DEDICATED_ACTION",
    });
    return;
  }
  if (changedFields.includes("status")) {
    res.status(422).json({
      error: "Status turnieju można zmienić wyłącznie przez dedykowaną operację lifecycle.",
      code: "TOURNAMENT_STATUS_REQUIRES_DEDICATED_ACTION",
    });
    return;
  }
  const t = await withTournamentMutationLock(
    params.data.id,
    getTournamentMutationActor(access),
    async (tx, prevT) => {
      const [updated] = await tx
        .update(tournamentsTable)
        .set(parsed.data)
        .where(eq(tournamentsTable.id, params.data.id))
        .returning();
      if (!updated) throw new Error("Tournament disappeared during update");

      if ("featuredMatchId" in (parsed.data as object)) {
        const newFeatured = (parsed.data as any).featuredMatchId ?? null;
        if (newFeatured !== prevT.featuredMatchId) {
          const [featuredMatch] = newFeatured
            ? await tx
                .select()
                .from(matchesTable)
                .where(
                  and(
                    eq(matchesTable.id, newFeatured),
                    eq(matchesTable.tournamentId, updated.id),
                  ),
                )
            : [undefined];
          await tx.insert(actionLogTable).values({
            tournamentId: updated.id,
            actionType: newFeatured ? "match_featured" : "match_unfeatured",
            description: newFeatured
              ? `Wyróżniono mecz R${featuredMatch?.round}M${featuredMatch?.matchNumber}`
              : "Zdjęto wyróżnienie meczu",
            matchId: newFeatured,
            undoPayload: JSON.stringify({
              type: "restore_featured",
              prevFeaturedMatchId: prevT.featuredMatchId,
            }),
            isUndone: false,
          });
        }
      }
      return updated;
    },
  );
  res.json(mapTournament(t));
});

router.delete("/tournaments/:id", async (req, res): Promise<void> => {
  const params = DeleteTournamentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  if (!await requireOrganizer(req, res, params.data.id)) return;
  await db.delete(tournamentsTable).where(eq(tournamentsTable.id, params.data.id));
  res.sendStatus(204);
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
  const access = await requireTournamentWrite(req, res, tournament.id);
  if (!access) return;
  const mutationActor = getTournamentMutationActor(access);

  const stages = await db
    .select({ id: tournamentStagesTable.id })
    .from(tournamentStagesTable)
    .where(eq(tournamentStagesTable.tournamentId, tournament.id))
    .orderBy(tournamentStagesTable.position);
  if (stages.length > 1) {
    try {
      await startStage({
        tournamentId: tournament.id,
        stageId: stages[0].id,
        actor: mutationActor,
      });
      const [updated] = await db
        .select()
        .from(tournamentsTable)
        .where(eq(tournamentsTable.id, tournament.id));
      res.json(mapTournament(updated));
    } catch (error) {
      if (error instanceof StageLifecycleError) {
        sendStageLifecycleError(error, res);
        return;
      }
      throw error;
    }
    return;
  }

  try {
    const updated = await db.transaction(async (tx) => {
      const [lockedTournament] = await tx
        .select()
        .from(tournamentsTable)
        .where(eq(tournamentsTable.id, params.data.id))
        .for("update");
      if (!lockedTournament) throw new Error("TOURNAMENT_NOT_FOUND");
      await revalidateTournamentMutationActor(tx, lockedTournament, mutationActor);
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
    if (error instanceof TournamentMutationAuthorizationError) {
      throw error;
    }
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
  const mutationActor = getTournamentMutationActor(access);

  try {
    const updated = await db.transaction(async (tx) => {
      const [tournament] = await tx
        .select()
        .from(tournamentsTable)
        .where(eq(tournamentsTable.id, params.data.id))
        .for("update");
      if (!tournament) throw new Error("TOURNAMENT_NOT_FOUND");
      await revalidateTournamentMutationActor(tx, tournament, mutationActor);
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
  const access = await requireTournamentWrite(req, res, params.data.id);
  if (!access) return;
  try {
    const player = await addTournamentPlayer({
      tournamentId: params.data.id,
      player: parsed.data,
      actor: getTournamentMutationActor(access),
    });
    res.status(201).json(mapPlayer(player));
  } catch (error) {
    if (error instanceof TournamentRosterError) {
      sendTournamentRosterError(error, res);
      return;
    }
    throw error;
  }
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

  const access = await requireTournamentWrite(req, res, params.data.id);
  if (!access) return;
  try {
    const result = await importTournamentPlayers({
      tournamentId: params.data.id,
      csv: parsed.data.csv,
      mode: parsed.data.mode === "replace" ? "replace" : "append",
      actor: getTournamentMutationActor(access),
    });
    res.json({ ...result, players: result.players.map(mapPlayer) });
  } catch (error) {
    if (error instanceof TournamentRosterError) {
      sendTournamentRosterError(error, res);
      return;
    }
    throw error;
  }
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
  const access = await requireTournamentWrite(req, res, existing.tournamentId);
  if (!access) return;
  try {
    const player = await updateTournamentPlayer({
      tournamentId: existing.tournamentId,
      playerId: params.data.id,
      changes: parsed.data,
      actor: getTournamentMutationActor(access),
    });
    res.json(mapPlayer(player));
  } catch (error) {
    if (error instanceof TournamentRosterError) {
      sendTournamentRosterError(error, res);
      return;
    }
    throw error;
  }
});

router.delete("/players/:id", async (req, res): Promise<void> => {
  const params = DeletePlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [toDelete] = await db.select().from(playersTable).where(eq(playersTable.id, params.data.id));
  if (!toDelete) { res.status(404).json({ error: "Player not found" }); return; }
  const access = await requireTournamentWrite(req, res, toDelete.tournamentId);
  if (!access) return;
  try {
    await deleteTournamentPlayer({
      tournamentId: toDelete.tournamentId,
      playerId: params.data.id,
      actor: getTournamentMutationActor(access),
    });
    res.sendStatus(204);
  } catch (error) {
    if (error instanceof TournamentRosterError) {
      sendTournamentRosterError(error, res);
      return;
    }
    throw error;
  }
});

// ========== ACTION LOG HELPERS ==========

const UNDOABLE_TYPES = new Set([
  "match_started", "match_postponed", "match_restored",
  "match_bo_changed", "match_featured", "match_unfeatured",
  "match_result_submitted", "player_added", "player_edited",
  "match_cancelled", "match_players_swapped",
]);

type RouteTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function logAction(params: {
  tournamentId: number;
  actionType: string;
  description: string;
  matchId?: number | null;
  undoPayload?: Record<string, unknown> | null;
}, executor: typeof db | RouteTransaction = db) {
  await executor.insert(actionLogTable).values({
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

  const access = await requireTournamentWrite(req, res, params.data.id);
  if (!access) return;
  const mutationActor = getTournamentMutationActor(access);

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

  if (payload.type === "delete_player" || payload.type === "restore_player") {
    try {
      const updated = await undoTournamentRosterAction({
        tournamentId: params.data.id,
        actionId: lastAction.id,
        actor: mutationActor,
      });
      res.json({
        action: mapActionLog(updated),
        message: `Cofnięto: ${lastAction.description}`,
      });
    } catch (error) {
      if (error instanceof TournamentRosterError) {
        sendTournamentRosterError(error, res);
        return;
      }
      throw error;
    }
    return;
  }

  try {
    if (payload.type === "revert_match") {
      const matchId = payload.matchId as number;
      if (!Number.isInteger(matchId) || matchId < 1) {
        throw new RevertMatchError("COMPLETION_LOG_AMBIGUOUS");
      }
      const result = await revertMatch({
        matchId,
        expectedTournamentId: params.data.id,
        expectedCompletionActionId: lastAction.id,
        actor: mutationActor,
      });
      res.json({
        action: mapActionLog(result.completionAction),
        message: `Cofnięto: ${lastAction.description}`,
      });
      return;
    }

    const updated = await withTournamentMutationLock(
      params.data.id,
      mutationActor,
      async (tx) => {
        const [lockedAction] = await tx
          .select()
          .from(actionLogTable)
          .where(eq(actionLogTable.id, lastAction.id))
          .for("update");
        if (
          !lockedAction ||
          lockedAction.tournamentId !== params.data.id ||
          lockedAction.isUndone ||
          !lockedAction.undoPayload
        ) {
          throw new RevertMatchError("UNDO_ACTION_CHANGED");
        }
        const lockedPayload = JSON.parse(lockedAction.undoPayload) as Record<string, unknown>;
        if (lockedPayload.type !== payload.type) {
          throw new RevertMatchError("UNDO_ACTION_CHANGED");
        }

        switch (lockedPayload.type) {
          case "restore_status": {
            const matchId = lockedPayload.matchId as number;
            const prevStatus = lockedPayload.prevStatus as string;
            await tx.update(matchesTable).set({ status: prevStatus as any }).where(and(
              eq(matchesTable.id, matchId),
              eq(matchesTable.tournamentId, params.data.id),
            ));
            await logAction({ tournamentId: params.data.id, actionType: "match_result_reverted", description: `Cofnięto status meczu (przywrócono: ${prevStatus})`, matchId }, tx);
            break;
          }
          case "restore_best_of": {
            const matchId = lockedPayload.matchId as number;
            const prevBestOf = lockedPayload.prevBestOf as number;
            await tx.update(matchesTable).set({ bestOf: prevBestOf }).where(and(
              eq(matchesTable.id, matchId),
              eq(matchesTable.tournamentId, params.data.id),
            ));
            await logAction({ tournamentId: params.data.id, actionType: "match_result_reverted", description: `Cofnięto zmianę BO (przywrócono: BO${prevBestOf})`, matchId }, tx);
            break;
          }
          case "restore_featured": {
            const prevFeaturedMatchId = (lockedPayload.prevFeaturedMatchId as number) ?? null;
            await tx.update(tournamentsTable).set({ featuredMatchId: prevFeaturedMatchId }).where(eq(tournamentsTable.id, params.data.id));
            await logAction({ tournamentId: params.data.id, actionType: "match_result_reverted", description: "Cofnięto zmianę wyróżnionego meczu" }, tx);
            break;
          }
          case "restore_cancelled_match": {
            const matchId = lockedPayload.matchId as number;
            const prevStatus = lockedPayload.prevStatus as string;
            const prevNote = (lockedPayload.prevNote as string | null) ?? null;
            await tx.update(matchesTable).set({ status: prevStatus as any, note: prevNote }).where(and(
              eq(matchesTable.id, matchId),
              eq(matchesTable.tournamentId, params.data.id),
            ));
            await logAction({ tournamentId: params.data.id, actionType: "match_restored", description: `Cofnięto anulowanie meczu (przywrócono status: ${prevStatus})`, matchId }, tx);
            break;
          }
          case "restore_players_swap": {
            const matchId = lockedPayload.matchId as number;
            await tx.update(matchesTable).set({
              player1Id: (lockedPayload.player1Id as number | null) ?? null,
              player2Id: (lockedPayload.player2Id as number | null) ?? null,
              score1: (lockedPayload.score1 as number | null) ?? null,
              score2: (lockedPayload.score2 as number | null) ?? null,
            }).where(and(
              eq(matchesTable.id, matchId),
              eq(matchesTable.tournamentId, params.data.id),
            ));
            await logAction({ tournamentId: params.data.id, actionType: "match_result_reverted", description: `Cofnięto zamianę zawodników w meczu ID ${matchId}`, matchId }, tx);
            break;
          }
          default:
            throw new Error(`UNDO_TYPE_UNSUPPORTED:${String(lockedPayload.type)}`);
        }

        const [savedAction] = await tx
          .update(actionLogTable)
          .set({ isUndone: true })
          .where(eq(actionLogTable.id, lockedAction.id))
          .returning();
        return savedAction;
      },
    );
    res.json({ action: mapActionLog(updated!), message: `Cofnięto: ${lastAction.description}` });
  } catch (err) {
    if (err instanceof RevertMatchError) {
      sendRevertMatchError(err, res);
      return;
    }
    if (err instanceof Error && err.message.startsWith("UNDO_TYPE_UNSUPPORTED:")) {
      res.status(400).json({
        error: `Nie można cofnąć akcji: ${err.message.slice("UNDO_TYPE_UNSUPPORTED:".length)}`,
      });
      return;
    }
    throw err;
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
  const access = await requireTournamentWrite(req, res, prevMatch.tournamentId);
  if (!access) return;
  const match = await withTournamentMutationLock(
    prevMatch.tournamentId,
    getTournamentMutationActor(access),
    async (tx) => {
      const [lockedMatch] = await tx
        .select()
        .from(matchesTable)
        .where(eq(matchesTable.id, params.data.id))
        .for("update");
      if (!lockedMatch) throw new Error("MATCH_NOT_FOUND");
      if (
        lockedMatch.status === "completed" &&
        (parsed.data.status != null || parsed.data.bestOf != null)
      ) {
        throw new Error("FINALIZED_MATCH_PATCH_FORBIDDEN");
      }
      if (parsed.data.bestOf != null) {
        if (!Number.isInteger(parsed.data.bestOf) || parsed.data.bestOf <= 0 || parsed.data.bestOf % 2 === 0) {
          throw new Error("INVALID_BEST_OF");
        }
        if (lockedMatch.status !== "pending") {
          throw new Error("BEST_OF_CHANGE_NOT_ALLOWED");
        }
      }
      const [saved] = await tx
        .update(matchesTable)
        .set(parsed.data)
        .where(eq(matchesTable.id, params.data.id))
        .returning();
      if (!saved) throw new Error("MATCH_STATE_CHANGED");

      if (parsed.data.status && parsed.data.status !== lockedMatch.status) {
        const participantIds = [lockedMatch.player1Id, lockedMatch.player2Id].filter(Boolean) as number[];
        const players = participantIds.length > 0
          ? await tx.select().from(playersTable).where(inArray(playersTable.id, participantIds))
          : [];
        const playerMap = new Map(players.map((player) => [player.id, player.name]));
        const matchLabel = `R${lockedMatch.round}M${lockedMatch.matchNumber}: ${playerMap.get(lockedMatch.player1Id ?? 0) ?? "TBD"} vs ${playerMap.get(lockedMatch.player2Id ?? 0) ?? "TBD"}`;
        if (parsed.data.status === "in_progress") {
          await logAction({ tournamentId: saved.tournamentId, actionType: "match_started", description: `Rozpoczęto mecz ${matchLabel}`, matchId: saved.id, undoPayload: { type: "restore_status", matchId: saved.id, prevStatus: lockedMatch.status } }, tx);
        } else if (parsed.data.status === "postponed") {
          await logAction({ tournamentId: saved.tournamentId, actionType: "match_postponed", description: `Przełożono mecz ${matchLabel}`, matchId: saved.id, undoPayload: { type: "restore_status", matchId: saved.id, prevStatus: lockedMatch.status } }, tx);
        } else if (parsed.data.status === "pending" && lockedMatch.status === "postponed") {
          await logAction({ tournamentId: saved.tournamentId, actionType: "match_restored", description: `Przywrócono mecz ${matchLabel}`, matchId: saved.id, undoPayload: { type: "restore_status", matchId: saved.id, prevStatus: "postponed" } }, tx);
        }
      }
      if (parsed.data.bestOf != null && parsed.data.bestOf !== lockedMatch.bestOf) {
        await logAction({ tournamentId: saved.tournamentId, actionType: "match_bo_changed", description: `Zmieniono format meczu R${saved.round}M${saved.matchNumber}: BO${lockedMatch.bestOf ?? 1} → BO${saved.bestOf}`, matchId: saved.id, undoPayload: { type: "restore_best_of", matchId: saved.id, prevBestOf: lockedMatch.bestOf ?? 1 } }, tx);
      }
      return saved;
    },
  ).catch((error: unknown) => {
    if (!(error instanceof Error)) throw error;
    const responses: Record<string, { status: number; error: string; code?: string }> = {
      MATCH_NOT_FOUND: { status: 404, error: "Match not found" },
      FINALIZED_MATCH_PATCH_FORBIDDEN: {
        status: 422,
        error: "Rozstrzygniętego meczu nie można zmieniać przez ogólny PATCH.",
        code: "FINALIZED_MATCH_PATCH_FORBIDDEN",
      },
      INVALID_BEST_OF: {
        status: 422,
        error: "bestOf musi być dodatnią, nieparzystą liczbą całkowitą.",
        code: "INVALID_BEST_OF",
      },
      BEST_OF_CHANGE_NOT_ALLOWED: {
        status: 422,
        error: "bestOf można zmienić tylko przed rozpoczęciem meczu.",
        code: "BEST_OF_CHANGE_NOT_ALLOWED",
      },
      MATCH_STATE_CHANGED: {
        status: 422,
        error: "Stan meczu zmienił się i PATCH nie może zostać bezpiecznie zastosowany.",
        code: "MATCH_STATE_CHANGED",
      },
    };
    const response = responses[error.message];
    if (!response) throw error;
    res.status(response.status).json({
      error: response.error,
      ...(response.code ? { code: response.code } : {}),
    });
    return null;
  });
  if (!match) return;
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
  const access = await requireTournamentWrite(req, res, matchReference.tournamentId);
  if (!access) return;

  try {
    const updatedMatch = await completeMatch({
      matchId: params.data.id,
      ...parsed.data,
      actor: getTournamentMutationActor(access),
    });
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
    throw error;
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
  const access = await requireTournamentWrite(req, res, matchReference.tournamentId);
  if (!access) return;

  try {
    const result = await revertMatch({
      matchId: params.data.id,
      expectedTournamentId: matchReference.tournamentId,
      actor: getTournamentMutationActor(access),
    });
    const [enriched] = await enrichMatches([result.match]);
    res.json(enriched);
  } catch (error) {
    if (error instanceof RevertMatchError) {
      sendRevertMatchError(error, res);
      return;
    }
    throw error;
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
  const access = await requireTournamentWrite(req, res, match.tournamentId);
  if (!access) return;
  const updated = await withTournamentMutationLock(
    match.tournamentId,
    getTournamentMutationActor(access),
    async (tx) => {
      const [lockedMatch] = await tx
        .select()
        .from(matchesTable)
        .where(eq(matchesTable.id, params.data.id))
        .for("update");
      if (!lockedMatch) throw new Error("Match disappeared during cancellation");
      const blockedStatuses = ["completed", "cancelled"];
      if (blockedStatuses.includes(lockedMatch.status)) {
        throw new Error(`MATCH_CANNOT_CANCEL:${lockedMatch.status}`);
      }
      const p1Ids = [lockedMatch.player1Id, lockedMatch.player2Id].filter(Boolean) as number[];
      const namePlayers = p1Ids.length > 0
        ? await tx.select().from(playersTable).where(inArray(playersTable.id, p1Ids))
        : [];
      const names = new Map(namePlayers.map((player) => [player.id, player.name]));
      const matchLabel = `R${lockedMatch.round}M${lockedMatch.matchNumber}: ${names.get(lockedMatch.player1Id ?? 0) ?? "TBD"} vs ${names.get(lockedMatch.player2Id ?? 0) ?? "TBD"}`;
      const [saved] = await tx
        .update(matchesTable)
        .set({
          status: "cancelled",
          note: parsed.data.note ?? lockedMatch.note ?? null,
        })
        .where(eq(matchesTable.id, params.data.id))
        .returning();
      await logAction({
        tournamentId: lockedMatch.tournamentId,
        actionType: "match_cancelled",
        description: `Anulowano mecz ${matchLabel}`,
        matchId: lockedMatch.id,
        undoPayload: {
          type: "restore_cancelled_match",
          matchId: lockedMatch.id,
          prevStatus: lockedMatch.status,
          prevNote: lockedMatch.note,
        },
      }, tx);
      return saved;
    },
  ).catch((error: unknown) => {
    if (error instanceof Error && error.message.startsWith("MATCH_CANNOT_CANCEL:")) {
      res.status(400).json({
        error: `Nie można anulować meczu o statusie: ${error.message.split(":")[1]}`,
      });
      return null;
    }
    throw error;
  });
  if (!updated) return;
  const [enriched] = await enrichMatches([updated]);
  res.json(enriched);
});

// ===== RESTORE CANCELLED MATCH =====
router.post("/matches/:id/restore-cancelled", async (req, res): Promise<void> => {
  const params = RestoreCancelledMatchParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.id));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  const access = await requireTournamentWrite(req, res, match.tournamentId);
  if (!access) return;
  const updated = await withTournamentMutationLock(
    match.tournamentId,
    getTournamentMutationActor(access),
    async (tx) => {
      const [lockedMatch] = await tx
        .select()
        .from(matchesTable)
        .where(eq(matchesTable.id, params.data.id))
        .for("update");
      if (!lockedMatch) throw new Error("Match disappeared during restore");
      if (lockedMatch.status !== "cancelled") throw new Error("MATCH_NOT_CANCELLED");
      const [saved] = await tx
        .update(matchesTable)
        .set({ status: "pending" })
        .where(eq(matchesTable.id, params.data.id))
        .returning();
      const p1Ids = [lockedMatch.player1Id, lockedMatch.player2Id].filter(Boolean) as number[];
      const namePlayers = p1Ids.length > 0
        ? await tx.select().from(playersTable).where(inArray(playersTable.id, p1Ids))
        : [];
      const names = new Map(namePlayers.map((player) => [player.id, player.name]));
      const matchLabel = `R${lockedMatch.round}M${lockedMatch.matchNumber}: ${names.get(lockedMatch.player1Id ?? 0) ?? "TBD"} vs ${names.get(lockedMatch.player2Id ?? 0) ?? "TBD"}`;
      await logAction({
        tournamentId: lockedMatch.tournamentId,
        actionType: "match_restored",
        description: `Przywrócono anulowany mecz ${matchLabel}`,
        matchId: lockedMatch.id,
        undoPayload: { type: "restore_status", matchId: lockedMatch.id, prevStatus: "cancelled" },
      }, tx);
      return saved;
    },
  ).catch((error: unknown) => {
    if (error instanceof Error && error.message === "MATCH_NOT_CANCELLED") {
      res.status(400).json({ error: "Mecz nie jest anulowany" });
      return null;
    }
    throw error;
  });
  if (!updated) return;
  const [enriched] = await enrichMatches([updated]);
  res.json(enriched);
});

// ===== SWAP PLAYERS =====
router.post("/matches/:id/swap-players", async (req, res): Promise<void> => {
  const params = SwapMatchPlayersParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.id));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  const access = await requireTournamentWrite(req, res, match.tournamentId);
  if (!access) return;
  const updated = await withTournamentMutationLock(
    match.tournamentId,
    getTournamentMutationActor(access),
    async (tx) => {
      const [lockedMatch] = await tx
        .select()
        .from(matchesTable)
        .where(eq(matchesTable.id, params.data.id))
        .for("update");
      if (!lockedMatch) throw new Error("Match disappeared during swap");
      if (lockedMatch.status === "completed") throw new Error("MATCH_CANNOT_SWAP");
      const [saved] = await tx
        .update(matchesTable)
        .set({
          player1Id: lockedMatch.player2Id ?? null,
          player2Id: lockedMatch.player1Id ?? null,
          score1: lockedMatch.score2 ?? null,
          score2: lockedMatch.score1 ?? null,
        })
        .where(eq(matchesTable.id, params.data.id))
        .returning();
      const p1Ids = [lockedMatch.player1Id, lockedMatch.player2Id].filter(Boolean) as number[];
      const namePlayers = p1Ids.length > 0
        ? await tx.select().from(playersTable).where(inArray(playersTable.id, p1Ids))
        : [];
      const names = new Map(namePlayers.map((player) => [player.id, player.name]));
      await logAction({
        tournamentId: lockedMatch.tournamentId,
        actionType: "match_players_swapped",
        description: `Zamieniono strony w R${lockedMatch.round}M${lockedMatch.matchNumber}: ${names.get(lockedMatch.player1Id ?? 0) ?? "TBD"} ↔ ${names.get(lockedMatch.player2Id ?? 0) ?? "TBD"}`,
        matchId: lockedMatch.id,
        undoPayload: {
          type: "restore_players_swap",
          matchId: lockedMatch.id,
          player1Id: lockedMatch.player1Id,
          player2Id: lockedMatch.player2Id,
          score1: lockedMatch.score1,
          score2: lockedMatch.score2,
        },
      }, tx);
      return saved;
    },
  ).catch((error: unknown) => {
    if (error instanceof Error && error.message === "MATCH_CANNOT_SWAP") {
      res.status(400).json({
        error: "Nie można zamieniać zawodników w meczu o statusie: completed",
      });
      return null;
    }
    throw error;
  });
  if (!updated) return;
  const [enriched] = await enrichMatches([updated]);
  res.json(enriched);
});

// ===== REORDER MATCHES =====
router.post("/tournaments/:id/reorder-matches", async (req, res): Promise<void> => {
  const params = ReorderMatchesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = ReorderMatchesBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const access = await requireTournamentWrite(req, res, params.data.id);
  if (!access) return;
  const mutationActor = getTournamentMutationActor(access);
  const { matchIds } = parsed.data;
  await withTournamentMutationLock(
    params.data.id,
    mutationActor,
    async (tx) => {
      const existing = await tx
        .select({ id: matchesTable.id })
        .from(matchesTable)
        .where(
          and(
            eq(matchesTable.tournamentId, params.data.id),
            inArray(matchesTable.id, matchIds),
          ),
        )
        .for("update");
      if (existing.length !== new Set(matchIds).size) {
        throw new Error("REORDER_MATCH_TOURNAMENT_MISMATCH");
      }
      for (const [index, matchId] of matchIds.entries()) {
        await tx
          .update(matchesTable)
          .set({ sortOrder: (index + 1) * 10 })
          .where(
            and(
              eq(matchesTable.id, matchId),
              eq(matchesTable.tournamentId, params.data.id),
            ),
          );
      }
    },
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
  const rawBackup =
    rawBody.backup && typeof rawBody.backup === "object"
      ? rawBody.backup as Record<string, unknown>
      : rawBody;
  const rawBackupTournament =
    rawBackup.tournament &&
    typeof rawBackup.tournament === "object" &&
    !Array.isArray(rawBackup.tournament)
      ? (rawBackup.tournament as Record<string, unknown>)
      : null;
  if (
    Object.prototype.hasOwnProperty.call(rawBody, "hostCode") ||
    (rawBackupTournament &&
      Object.prototype.hasOwnProperty.call(rawBackupTournament, "hostCode"))
  ) {
    res.status(400).json({
      error: "Backup nie może odtwarzać historycznego hostCode.",
      code: "INVALID_BACKUP_CREDENTIALS",
    });
    return;
  }
  if (rawBackup.version === "1" || rawBackup.schemaVersion === 1) {
    res.status(400).json({
      error: "Nieobsługiwany format legacy backupu v1. Wymagany jest backup series_v1/v2 albo v3.",
      code: "LEGACY_BACKUP_UNSUPPORTED",
    });
    return;
  }
  if (
    typeof rawBody.organizerPassword !== "string" ||
    rawBody.organizerPassword.length < NEW_CREDENTIAL_MIN_LENGTH
  ) {
    const restoringPrivateOnline =
      rawBackup.tournament &&
      typeof rawBackup.tournament === "object" &&
      !Array.isArray(rawBackup.tournament) &&
      (rawBackup.tournament as Record<string, unknown>).visibility === "private_online";
    res.status(422).json({
      error: restoringPrivateOnline
        ? `Nowe hasło organizatora oraz hasło widza są wymagane dla odtwarzanego turnieju private_online i muszą mieć co najmniej ${NEW_CREDENTIAL_MIN_LENGTH} znaków.`
        : `Nowe hasło organizatora jest wymagane i musi mieć co najmniej ${NEW_CREDENTIAL_MIN_LENGTH} znaków.`,
      code: "ORGANIZER_PASSWORD_REQUIRED",
      missingFields: restoringPrivateOnline
        ? ["organizerPassword", "viewerPassword"]
        : ["organizerPassword"],
    });
    return;
  }
  if (
    typeof rawBody.supportPassword === "string" &&
    rawBody.supportPassword.length > 0 &&
    rawBody.supportPassword.length < NEW_CREDENTIAL_MIN_LENGTH
  ) {
    res.status(422).json({
      error: `Nowe hasło wsparcia musi mieć co najmniej ${NEW_CREDENTIAL_MIN_LENGTH} znaków.`,
      code: "SUPPORT_PASSWORD_TOO_SHORT",
    });
    return;
  }
  if (
    rawBackup.tournament &&
    typeof rawBackup.tournament === "object" &&
    !Array.isArray(rawBackup.tournament) &&
    (rawBackup.tournament as Record<string, unknown>).visibility === "private_online" &&
    (typeof rawBody.viewerPassword !== "string" ||
      rawBody.viewerPassword.length < NEW_CREDENTIAL_MIN_LENGTH)
  ) {
    res.status(422).json({
      error: `Nowe hasło widza jest wymagane dla odtwarzanego turnieju private_online i musi mieć co najmniej ${NEW_CREDENTIAL_MIN_LENGTH} znaków.`,
      code: "VIEWER_PASSWORD_REQUIRED",
    });
    return;
  }
  if (rawBackup.schemaVersion !== 2 && rawBackup.schemaVersion !== 3) {
    res.status(400).json({
      error: `Nieobsługiwana wersja backupu (${String(rawBackup.schemaVersion)}). Wymagany jest format v2 albo v3.`,
      code: "BACKUP_VERSION_UNSUPPORTED",
    });
    return;
  }
  const parsed = ImportTournamentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Nieprawidłowe żądanie odtworzenia backupu v2/v3.", code: "INVALID_BACKUP" });
    return;
  }
  const {
    backup: parsedBackup,
    organizerPassword,
    viewerPassword,
    supportPassword,
  } = parsed.data as unknown as {
    backup: TournamentBackupV2 | TournamentBackupV3;
    organizerPassword: string;
    viewerPassword?: string;
    supportPassword?: string;
  };

  const parsedSchemaVersion = Number(parsedBackup.schemaVersion);
  if (parsedSchemaVersion !== 2 && parsedSchemaVersion !== 3) {
    res.status(400).json({ error: `Nieobsługiwana wersja backupu (${parsedSchemaVersion}). Wymagany jest format v2 albo v3.`, code: "BACKUP_VERSION_UNSUPPORTED" });
    return;
  }

  try {
    const organizerPasswordHash = await hashPassword(organizerPassword);
    const credentials = {
      hostCode: null,
      organizerPasswordHash,
      supportPasswordHash: supportPassword ? await hashPassword(supportPassword) : null,
      supportPasswordVersion: 1,
      viewerPasswordHash: viewerPassword ? await hashPassword(viewerPassword) : null,
      viewerPasswordVersion: 1,
    };
    const imported = parsedBackup.schemaVersion === 2
      ? await importBackupV2(parsedBackup as TournamentBackupV2, credentials)
      : await importBackupV3(parsedBackup as TournamentBackupV3, credentials);
    res.status(201).json({
      tournament: mapTournament(imported.tournament),
      playersImported: imported.playersImported,
      matchesImported: imported.matchesImported,
      organizerToken: signVersionedOrganizerToken(
        imported.tournament.id,
        organizerPasswordHash,
      ),
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
