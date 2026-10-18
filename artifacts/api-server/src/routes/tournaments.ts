import { Router, type IRouter } from "express";
import { deriveTournamentOperations } from "../application/operations/tournament-operations";
import { deriveTournamentProgressionPreflight } from "../application/operations/tournament-progression-preflight";
import { eq, and, sql, inArray, desc, ne } from "drizzle-orm";
import { db, tournamentsTable, tournamentStagesTable, stageParticipantsTable, playersTable, matchesTable, resultHistoryTable, actionLogTable, authAuditLogTable, playerDeadlockBansTable, matchGamePicksTable, tournamentGameConfigsTable } from "@workspace/db";
import {
  TournamentGameConfigError,
  getDeadlockBanMode,
  getDeadlockBansPerPlayer,
  getDeadlockEffectiveStageBans,
  type SupportedTournamentGameConfig,
} from "@workspace/game-catalog";
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
  shouldUseStageLifecycleForLegacyTournamentStart,
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
  getStageBasketConfiguration,
  loadStageBasketConfigurationInTransaction,
  replaceStageBasketConfiguration,
  StageBasketConfigurationError,
} from "../application/stages/stage-basket-configuration";
import {
  getSeedingCeremony,
  prepareSeedingCeremony,
  resetSeedingCeremony,
  revealAllSeedingDraws,
  revealNextSeedingDraw,
  SeedingCeremonyError,
  type SeedingCeremonyErrorCode,
} from "../application/stages/seeding-ceremony";
import {
  DoubleEliminationStageError,
  getDoubleEliminationStageState,
  resetDoubleEliminationStage,
} from "../application/stages/double-elimination-stage";
import {
  assignMarvelManualGroups,
  getMarvelEliminationStageState,
  MarvelEliminationStageError,
  submitMarvelGroupResult,
} from "../application/stages/marvel-elimination-stage";
import {
  approveQualificationProposal,
  generateQualificationProposal,
  getQualificationOutput,
  getQualificationProposal,
  QualificationProposalError,
  type QualificationProposalErrorCode,
} from "../application/stages/stage-basket-qualification";
import {
  BasketRouteExecutionError,
  type BasketRouteExecutionErrorCode,
  executeBasketRoute,
  getBasketRouteStatus,
  getTargetStageInputArrivals,
} from "../application/stages/stage-basket-route-execution";
import { calculateMatchRecordStandings } from "../domain/tournament/standings";
import { generateRoundRobinSchedule } from "../domain/tournament/round-robin";
import { generateSwissPairings } from "../domain/tournament/swiss";
import { buildStandardSeededBracket } from "../domain/tournament/stage-placement";
import { validatePlayedSeriesResult } from "../domain/match/series-result";
import {
  loadTournamentGameConfig,
  loadTournamentGameConfigMap,
  replaceTournamentGameConfig,
  TournamentGameConfigImmutableError,
} from "../application/games/tournament-game-config";
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
  GetTournamentStageBasketsParams,
  UpdateTournamentStageBasketsParams,
  UpdateTournamentStageBasketsBody,
  GetTournamentStageParams,
  PreviewStageQualificationParams,
  CompleteTournamentStageParams,
  StartTournamentStageParams,
  GetDoubleEliminationStageParams,
  ResetDoubleEliminationStageParams,
  ResetDoubleEliminationStageBody,
  GetMarvelEliminationStageParams,
  SubmitMarvelEliminationGroupResultParams,
  SubmitMarvelEliminationGroupResultBody,
  AssignMarvelEliminationManualGroupsParams,
  AssignMarvelEliminationManualGroupsBody,
  type TournamentBackupV2,
  type TournamentBackupV3,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Phase 3 — basket-level route params (stageId + basketId).
function parseStageBasketParams(
  params: Record<string, string>,
): { id: number; stageId: number; basketId: string } | null {
  const id = parseInt(params["id"] ?? "", 10);
  const stageId = parseInt(params["stageId"] ?? "", 10);
  const basketId = params["basketId"] ?? "";
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(stageId) || stageId <= 0 || !basketId) return null;
  return { id, stageId, basketId };
}

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

function sendStageBasketConfigurationError(
  error: StageBasketConfigurationError,
  res: import("express").Response,
): void {
  const status = error.code === "TOURNAMENT_NOT_FOUND"
    ? 404
    : error.code === "STAGE_BASKET_CONFIGURATION_INVALID"
      ? 422
      : 409;
  res.status(status).json({
    error: error.message,
    code: error.code,
    problems: error.problems,
  });
}

function sendDoubleEliminationError(
  error: DoubleEliminationStageError,
  res: import("express").Response,
): void {
  const notFound = new Set(["TOURNAMENT_NOT_FOUND", "STAGE_NOT_FOUND", "DOUBLE_ELIMINATION_EXECUTION_NOT_FOUND"]);
  res.status(notFound.has(error.code) ? 404 : 409).json({
    error: error.message,
    code: error.code,
  });
}

function sendMarvelEliminationError(
  error: MarvelEliminationStageError,
  res: import("express").Response,
): void {
  const notFound = new Set([
    "MARVEL_STAGE_NOT_FOUND",
    "MARVEL_GROUP_NOT_FOUND",
  ]);
  const invalid = new Set([
    "MARVEL_GROUP_RESULT_INVALID",
    "MARVEL_MANUAL_GROUPING_INVALID",
  ]);
  const status = notFound.has(error.code)
    ? 404
    : invalid.has(error.code)
      ? 400
      : error.code === "MARVEL_STAGE_CONFIGURATION_INVALID"
        ? 422
        : 409;
  res.status(status).json({ error: error.message, code: error.code });
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

function sendBasketRouteExecutionError(
  error: BasketRouteExecutionError,
  res: import("express").Response,
): void {
  const notFound = new Set<BasketRouteExecutionErrorCode>([
    "TOURNAMENT_NOT_FOUND",
    "STAGE_NOT_FOUND",
    "ROUTE_NOT_FOUND",
  ]);
  const conflict = new Set<BasketRouteExecutionErrorCode>([
    "STAGE_BASKET_ROUTE_SOURCE_NOT_APPROVED",
    "STAGE_BASKET_ROUTE_SOURCE_STAGE_NOT_COMPLETED",
    "STAGE_BASKET_ROUTE_SOURCE_OUTPUT_INCOMPLETE",
    "STAGE_BASKET_ROUTE_TARGET_STAGE_ALREADY_STARTED",
    "STAGE_BASKET_ROUTE_PARTICIPANT_CONFLICT",
    "STAGE_BASKET_ROUTE_LEGACY_NOT_SUPPORTED",
  ]);
  const status = notFound.has(error.code) ? 404 : conflict.has(error.code) ? 409 : 422;
  res.status(status).json({ error: error.message, code: error.code, details: error.details ?? null });
}

function sendQualificationProposalError(
  error: QualificationProposalError,
  res: import("express").Response,
): void {
  const notFound = new Set<QualificationProposalErrorCode>([
    "TOURNAMENT_NOT_FOUND",
    "STAGE_NOT_FOUND",
    "STAGE_BASKET_QUALIFICATION_PROPOSAL_NOT_FOUND",
  ]);
  const conflict = new Set<QualificationProposalErrorCode>([
    "STAGE_BASKET_CONFIGURATION_NOT_EXPLICIT",
    "STAGE_BASKET_QUALIFICATION_FORMAT_NOT_SUPPORTED",
    "STAGE_BASKET_QUALIFICATION_ALREADY_APPROVED",
    "STAGE_BASKET_QUALIFICATION_PROPOSAL_STALE",
    "STAGE_BASKET_QUALIFICATION_STAGE_INCOMPLETE",
    "RANKING_INCONSISTENT",
  ]);
  res
    .status(notFound.has(error.code) ? 404 : conflict.has(error.code) ? 409 : 422)
    .json({ error: error.message, code: error.code, ...(error.details ? { details: error.details } : {}) });
}

function sendTournamentRosterError(
  error: TournamentRosterError,
  res: import("express").Response,
): void {
  const status = error.code === "TOURNAMENT_NOT_FOUND" || error.code === "PLAYER_NOT_FOUND"
    ? 404
    : error.code === "ROSTER_LOCKED" || error.code === "DUPLICATE_PLAYER_NAME" || error.code === "UNDO_ACTION_CHANGED"
      ? 409
      : 422;
  res.status(status).json({ error: error.message, code: error.code });
}

function formatDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString();
}

function mapTournament(
  t: typeof tournamentsTable.$inferSelect,
  gameConfig: SupportedTournamentGameConfig | null = null,
) {
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
    gameConfig,
    presentationSettings: t.presentationSettings as { deadlockTheme?: boolean } | null ?? null,
  };
}

function ownValue(value: unknown, key: string): unknown {
  return value != null && typeof value === "object" && !Array.isArray(value) &&
      Object.prototype.hasOwnProperty.call(value, key)
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

async function mapTournamentWithGameConfig(
  tournament: typeof tournamentsTable.$inferSelect,
) {
  return mapTournament(
    tournament,
    await loadTournamentGameConfig(tournament.id),
  );
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

async function calculateStandings(
  players: (typeof playersTable.$inferSelect)[],
  matches: (typeof matchesTable.$inferSelect)[],
  tournament: typeof tournamentsTable.$inferSelect,
) {
  const stages = await db.select().from(tournamentStagesTable)
    .where(eq(tournamentStagesTable.tournamentId, tournament.id)).limit(2);
  const stage = stages.length === 1 ? stages[0] : undefined;
  if (stage && stage.status !== "planned" && (stage.format === "round_robin" || stage.format === "swiss")) {
    const members = await db.select({ playerId: stageParticipantsTable.playerId, stageSeed: stageParticipantsTable.stageSeed })
      .from(stageParticipantsTable).where(eq(stageParticipantsTable.stageId, stage.id));
    const seeds = new Map(members.map(member => [member.playerId, member.stageSeed]));
    // A stage's frozen seeding, not registration order, resolves ranking ties.
    return calculateMatchRecordStandings(
      players.filter(player => seeds.has(player.id)).map(player => ({ ...player, seed: seeds.get(player.id)! })),
      matches.filter(match => match.stageId === stage.id),
      stage.format,
    );
  }
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
  const gameConfigs = await loadTournamentGameConfigMap(
    tournaments.map((tournament) => tournament.id),
  );
  res.json(
    tournaments.map((tournament) =>
      mapTournament(tournament, gameConfigs.get(tournament.id) ?? null),
    ),
  );
});

router.post("/tournaments", async (req, res): Promise<void> => {
  if (Object.prototype.hasOwnProperty.call(req.body ?? {}, "hostCode")) {
    res.status(422).json({
      error: "hostCode jest historycznym poświadczeniem i nie może być ustawiany dla nowego turnieju.",
      code: "HOST_CODE_LEGACY_ONLY",
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
  const requestBody = req.body;
  const rawGameConfig = ownValue(requestBody, "gameConfig");
  const parsed = CreateTournamentBody.safeParse(requestBody);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.visibility === "private_online" && !parsed.data.viewerPassword) {
    res.status(422).json({
      error: "Turniej prywatny online wymaga hasła widza.",
      code: "VIEWER_PASSWORD_REQUIRED",
    });
    return;
  }
  if (parsed.data.defaultBestOf != null && (!Number.isInteger(parsed.data.defaultBestOf) || parsed.data.defaultBestOf % 2 === 0)) {
    res.status(422).json({ error: "defaultBestOf musi być dodatnią nieparzystą liczbą całkowitą.", code: "INVALID_DEFAULT_BEST_OF" });
    return;
  }
  const {
    organizerPassword: rawOrganizerPassword,
    supportPassword,
    viewerPassword,
    stagePlan,
    gameConfig,
    ...rest
  } = parsed.data;
  // group_stage cannot be a standalone single-stage tournament: it is structurally a
  // non-final format (GROUP_STAGE_CANNOT_BE_FINAL) and the DB constraint requires
  // groupCount/participantsPerGroup/qualifiersPerGroup which are not available here.
  // Users must configure group_stage via the multi-stage plan flow.
  if (rest.format === "group_stage" && stagePlan == null) {
    res.status(422).json({
      error: "Format Faza grupowa wymaga wieloetapowego planu — użyj trybu etapowego i podaj konfigurację grup.",
      code: "STAGE_FORMAT_NOT_SUPPORTED",
    });
    return;
  }
  const insertValues: any = { ...rest };
  insertValues.organizerPasswordHash = await hashPassword(rawOrganizerPassword);
  if (supportPassword) insertValues.supportPasswordHash = await hashPassword(supportPassword);
  if (viewerPassword) insertValues.viewerPasswordHash = await hashPassword(viewerPassword);
  try {
    const created = await createTournamentWithStagePlan({
      tournament: insertValues,
      stagePlan,
      gameConfig: rawGameConfig === undefined ? gameConfig : rawGameConfig,
    });
    res.status(201).json({
      ...mapTournament(created.tournament, created.gameConfig),
      organizerToken: signVersionedOrganizerToken(
        created.tournament.id,
        created.tournament.organizerPasswordHash,
      ),
    });
  } catch (error) {
    if (error instanceof TournamentStagePlanError) {
      res.status(422).json({ error: error.message, code: "INVALID_STAGE_PLAN", details: error.problems });
      return;
    }
    if (error instanceof TournamentGameConfigError) {
      res.status(400).json({ error: error.message, code: error.code });
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
  res.json(await mapTournamentWithGameConfig(access.tournament));
});

router.get("/tournaments/:id/stages", async (req, res): Promise<void> => {
  const params = ListTournamentStagesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireTournamentRead(req, res, params.data.id)) return;
  res.json(await listTournamentStages(params.data.id));
});

router.get("/tournaments/:id/stage-baskets", async (req, res): Promise<void> => {
  const params = GetTournamentStageBasketsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireTournamentRead(req, res, params.data.id)) return;
  try {
    res.json(await getStageBasketConfiguration(params.data.id));
  } catch (error) {
    if (error instanceof StageBasketConfigurationError) {
      sendStageBasketConfigurationError(error, res);
      return;
    }
    throw error;
  }
});

router.put("/tournaments/:id/stage-baskets", async (req, res): Promise<void> => {
  const params = UpdateTournamentStageBasketsParams.safeParse(req.params);
  const body = UpdateTournamentStageBasketsBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid stage basket configuration" });
    return;
  }
  const access = await requireOrganizer(req, res, params.data.id);
  if (!access) return;
  try {
    res.json(await replaceStageBasketConfiguration({
      tournamentId: params.data.id,
      baskets: body.data.baskets,
      routes: body.data.routes,
      actor: getTournamentMutationActor(access),
    }));
  } catch (error) {
    if (error instanceof StageBasketConfigurationError) {
      sendStageBasketConfigurationError(error, res);
      return;
    }
    throw error;
  }
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
  const access = await requireOrganizer(req, res, params.data.id);
  if (!access) return;
  try {
    res.json({ ceremony: await prepareSeedingCeremony({ tournamentId: params.data.id, stageId: params.data.stageId, actor: getTournamentMutationActor(access) }) });
  } catch (error) {
    if (error instanceof SeedingCeremonyError) { sendSeedingCeremonyError(error, res); return; }
    throw error;
  }
});

router.post("/tournaments/:id/stages/:stageId/seeding-ceremony/reveal-next", async (req, res): Promise<void> => {
  const params = StartTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const access = await requireOrganizer(req, res, params.data.id);
  if (!access) return;
  try {
    res.json({ ceremony: await revealNextSeedingDraw({ tournamentId: params.data.id, stageId: params.data.stageId, actor: getTournamentMutationActor(access) }) });
  } catch (error) {
    if (error instanceof SeedingCeremonyError) { sendSeedingCeremonyError(error, res); return; }
    throw error;
  }
});

router.post("/tournaments/:id/stages/:stageId/seeding-ceremony/reveal-all", async (req, res): Promise<void> => {
  const params = StartTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const access = await requireOrganizer(req, res, params.data.id);
  if (!access) return;
  try {
    res.json({ ceremony: await revealAllSeedingDraws({ tournamentId: params.data.id, stageId: params.data.stageId, actor: getTournamentMutationActor(access) }) });
  } catch (error) {
    if (error instanceof SeedingCeremonyError) { sendSeedingCeremonyError(error, res); return; }
    throw error;
  }
});

router.delete("/tournaments/:id/stages/:stageId/seeding-ceremony", async (req, res): Promise<void> => {
  const params = StartTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const access = await requireOrganizer(req, res, params.data.id);
  if (!access) return;
  try {
    await resetSeedingCeremony({ tournamentId: params.data.id, stageId: params.data.stageId, actor: getTournamentMutationActor(access) });
    res.status(204).send();
  } catch (error) {
    if (error instanceof SeedingCeremonyError) { sendSeedingCeremonyError(error, res); return; }
    throw error;
  }
});

router.post("/tournaments/:id/stages/:stageId/complete", async (req, res): Promise<void> => {
  const params = CompleteTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const access = await requireOrganizer(req, res, params.data.id);
  if (!access) return;
  try {
    res.json(await completeStage({ tournamentId: params.data.id, stageId: params.data.stageId, actor: getTournamentMutationActor(access) }));
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
  const access = await requireOrganizer(req, res, params.data.id);
  if (!access) return;
  try {
    res.json(serializeTournamentStage(await startStage({ tournamentId: params.data.id, stageId: params.data.stageId, actor: getTournamentMutationActor(access) })));
  } catch (error) {
    if (error instanceof StageLifecycleError) {
      sendStageLifecycleError(error, res);
      return;
    }
    if (error instanceof MarvelEliminationStageError) {
      sendMarvelEliminationError(error, res);
      return;
    }
    throw error;
  }
});

router.get("/tournaments/:id/stages/:stageId/double-elimination", async (req, res): Promise<void> => {
  const params = GetDoubleEliminationStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireTournamentRead(req, res, params.data.id)) return;
  try {
    res.json(await getDoubleEliminationStageState({
      tournamentId: params.data.id,
      stageId: params.data.stageId,
    }));
  } catch (error) {
    if (error instanceof DoubleEliminationStageError) { sendDoubleEliminationError(error, res); return; }
    throw error;
  }
});

router.post("/tournaments/:id/stages/:stageId/double-elimination/reset", async (req, res): Promise<void> => {
  const params = ResetDoubleEliminationStageParams.safeParse(req.params);
  const body = ResetDoubleEliminationStageBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid Double Elimination reset" });
    return;
  }
  const access = await requireOrganizer(req, res, params.data.id);
  if (!access) return;
  try {
    res.json(await resetDoubleEliminationStage({
      tournamentId: params.data.id,
      stageId: params.data.stageId,
      expectedRevision: body.data.expectedRevision,
      actor: getTournamentMutationActor(access),
    }));
  } catch (error) {
    if (error instanceof DoubleEliminationStageError) { sendDoubleEliminationError(error, res); return; }
    throw error;
  }
});

router.get(
  "/tournaments/:id/stages/:stageId/marvel-elimination",
  async (req, res): Promise<void> => {
    const params = GetMarvelEliminationStageParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    if (!await requireTournamentRead(req, res, params.data.id)) return;
    try {
      res.json(await getMarvelEliminationStageState({
        tournamentId: params.data.id,
        stageId: params.data.stageId,
      }));
    } catch (error) {
      if (error instanceof MarvelEliminationStageError) {
        sendMarvelEliminationError(error, res);
        return;
      }
      throw error;
    }
  },
);

router.put(
  "/tournaments/:id/stages/:stageId/marvel-elimination/groups/:groupId/result",
  async (req, res): Promise<void> => {
    const params = SubmitMarvelEliminationGroupResultParams.safeParse(req.params);
    const body = SubmitMarvelEliminationGroupResultBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({
        error: "Invalid Marvel group result",
        code: "MARVEL_GROUP_RESULT_INVALID",
      });
      return;
    }
    const access = await requireTournamentWrite(req, res, params.data.id);
    if (!access) return;
    try {
      res.json(await submitMarvelGroupResult({
        tournamentId: params.data.id,
        stageId: params.data.stageId,
        groupId: params.data.groupId,
        placements: body.data.placements,
        actor: getTournamentMutationActor(access),
      }));
    } catch (error) {
      if (error instanceof MarvelEliminationStageError) {
        sendMarvelEliminationError(error, res);
        return;
      }
      throw error;
    }
  },
);

router.put(
  "/tournaments/:id/stages/:stageId/marvel-elimination/manual-groups",
  async (req, res): Promise<void> => {
    const params = AssignMarvelEliminationManualGroupsParams.safeParse(req.params);
    const body = AssignMarvelEliminationManualGroupsBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({
        error: "Invalid Marvel manual grouping",
        code: "MARVEL_MANUAL_GROUPING_INVALID",
      });
      return;
    }
    const access = await requireTournamentWrite(req, res, params.data.id);
    if (!access) return;
    try {
      res.json(await assignMarvelManualGroups({
        tournamentId: params.data.id,
        stageId: params.data.stageId,
        groups: body.data.groups,
        actor: getTournamentMutationActor(access),
      }));
    } catch (error) {
      if (error instanceof MarvelEliminationStageError) {
        sendMarvelEliminationError(error, res);
        return;
      }
      throw error;
    }
  },
);

// ─── Phase 2: Qualification Proposals ────────────────────────────────────────

router.post("/tournaments/:id/stages/:stageId/basket-qualification-proposal", async (req, res): Promise<void> => {
  const params = GetTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const access = await requireOrganizer(req, res, params.data.id);
  if (!access) return;
  try {
    res.json(await generateQualificationProposal(
      params.data.id,
      params.data.stageId,
      getTournamentMutationActor(access),
    ));
  } catch (error) {
    if (error instanceof QualificationProposalError) { sendQualificationProposalError(error, res); return; }
    throw error;
  }
});

router.get("/tournaments/:id/stages/:stageId/basket-qualification-proposal", async (req, res): Promise<void> => {
  const params = GetTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireTournamentRead(req, res, params.data.id)) return;
  try {
    const proposal = await getQualificationProposal(params.data.id, params.data.stageId);
    if (!proposal) {
      res.status(404).json({ error: "No proposal found for this stage.", code: "STAGE_BASKET_QUALIFICATION_PROPOSAL_NOT_FOUND" });
      return;
    }
    res.json(proposal);
  } catch (error) {
    if (error instanceof QualificationProposalError) { sendQualificationProposalError(error, res); return; }
    throw error;
  }
});

router.post("/tournaments/:id/stages/:stageId/basket-qualification-proposal/approve", async (req, res): Promise<void> => {
  const params = GetTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const access = await requireOrganizer(req, res, params.data.id);
  if (!access) return;
  try {
    res.json(await approveQualificationProposal(
      params.data.id,
      params.data.stageId,
      getTournamentMutationActor(access),
    ));
  } catch (error) {
    if (error instanceof QualificationProposalError) { sendQualificationProposalError(error, res); return; }
    throw error;
  }
});

router.get("/tournaments/:id/stages/:stageId/basket-qualification-output", async (req, res): Promise<void> => {
  const params = GetTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireTournamentRead(req, res, params.data.id)) return;
  const output = await getQualificationOutput(params.data.id, params.data.stageId);
  res.json({ entries: output });
});

// ─── Phase 3: Basket Route Execution ─────────────────────────────────────────

router.post("/tournaments/:id/stages/:stageId/baskets/:basketId/route/execute", async (req, res): Promise<void> => {
  const params = parseStageBasketParams(req.params as Record<string, string>);
  if (!params) { res.status(400).json({ error: "Invalid parameters" }); return; }
  const access = await requireOrganizer(req, res, params.id);
  if (!access) return;
  try {
    const result = await executeBasketRoute(
      params.id,
      params.stageId,
      params.basketId,
      getTournamentMutationActor(access),
    );
    res.json(result);
  } catch (error) {
    if (error instanceof BasketRouteExecutionError) { sendBasketRouteExecutionError(error, res); return; }
    throw error;
  }
});

router.get("/tournaments/:id/stages/:stageId/baskets/:basketId/route", async (req, res): Promise<void> => {
  const params = parseStageBasketParams(req.params as Record<string, string>);
  if (!params) { res.status(400).json({ error: "Invalid parameters" }); return; }
  if (!await requireTournamentRead(req, res, params.id)) return;
  try {
    const result = await getBasketRouteStatus(
      params.id,
      params.stageId,
      params.basketId,
    );
    res.json(result);
  } catch (error) {
    if (error instanceof BasketRouteExecutionError) { sendBasketRouteExecutionError(error, res); return; }
    throw error;
  }
});

router.get("/tournaments/:id/stages/:stageId/basket-input-arrivals", async (req, res): Promise<void> => {
  const params = GetTournamentStageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireTournamentRead(req, res, params.data.id)) return;
  try {
    const result = await getTargetStageInputArrivals(params.data.id, params.data.stageId);
    res.json(result);
  } catch (error) {
    if (error instanceof BasketRouteExecutionError) { sendBasketRouteExecutionError(error, res); return; }
    throw error;
  }
});

router.patch("/tournaments/:id", async (req, res): Promise<void> => {
  const params = UpdateTournamentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const rawGameConfig = ownValue(req.body, "gameConfig");
  const rawPresentationSettings = ownValue(req.body, "presentationSettings");
  const hasPresentationSettings = Object.prototype.hasOwnProperty.call(req.body ?? {}, "presentationSettings");
  const parsed = UpdateTournamentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.defaultBestOf != null && (!Number.isInteger(parsed.data.defaultBestOf) || parsed.data.defaultBestOf % 2 === 0)) {
    res.status(422).json({ error: "defaultBestOf musi być dodatnią nieparzystą liczbą całkowitą.", code: "INVALID_DEFAULT_BEST_OF" });
    return;
  }
  // Validate presentationSettings if provided
  if (hasPresentationSettings && rawPresentationSettings != null) {
    if (typeof rawPresentationSettings !== "object" || Array.isArray(rawPresentationSettings)) {
      res.status(400).json({ error: "presentationSettings must be an object or null." });
      return;
    }
    const ps = rawPresentationSettings as Record<string, unknown>;
    if ("deadlockTheme" in ps && ps.deadlockTheme !== undefined && typeof ps.deadlockTheme !== "boolean") {
      res.status(400).json({ error: "presentationSettings.deadlockTheme must be a boolean." });
      return;
    }
    for (const field of ["colorPreset", "fontPreset", "frameStyle"] as const) {
      if (field in ps && ps[field] !== undefined && ps[field] !== null && typeof ps[field] !== "string") {
        res.status(400).json({ error: `presentationSettings.${field} must be a string or null.` });
        return;
      }
    }
  }
  const changedFields = [
    ...Object.keys(parsed.data),
    ...(hasPresentationSettings ? ["presentationSettings"] : []),
  ];
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
  const { gameConfig, ...tournamentUpdate } = parsed.data;
  const hasGameConfig = Object.prototype.hasOwnProperty.call(
    parsed.data,
    "gameConfig",
  );
  try {
    const result = await withTournamentMutationLock(
      params.data.id,
      getTournamentMutationActor(access),
      async (tx, prevT) => {
        if (hasGameConfig && prevT.status !== "draft") {
          throw new TournamentGameConfigImmutableError();
        }
      const updated = Object.keys(tournamentUpdate).length === 0
        ? prevT
        : (
            await tx
              .update(tournamentsTable)
              .set(tournamentUpdate)
              .where(eq(tournamentsTable.id, params.data.id))
              .returning()
          )[0];
      if (!updated) throw new Error("Tournament disappeared during update");

      // Handle presentationSettings — no status lock (editable at any tournament status)
      let finalTournament = updated;
      if (hasPresentationSettings) {
        const newPs = rawPresentationSettings == null
          ? null
          : { ...((rawPresentationSettings as Record<string, unknown>)) };
        const [afterPs] = await tx
          .update(tournamentsTable)
          .set({ presentationSettings: newPs })
          .where(eq(tournamentsTable.id, params.data.id))
          .returning();
        if (afterPs) finalTournament = afterPs;
      }

      const updatedGameConfig = hasGameConfig
        ? await replaceTournamentGameConfig(
            tx,
            finalTournament.id,
            rawGameConfig === undefined ? gameConfig : rawGameConfig,
          )
        : undefined;

      if ("featuredMatchId" in tournamentUpdate) {
        const newFeatured = tournamentUpdate.featuredMatchId ?? null;
        if (newFeatured !== prevT.featuredMatchId) {
          const [featuredMatch] = newFeatured
            ? await tx
                .select()
                .from(matchesTable)
                .where(
                  and(
                    eq(matchesTable.id, newFeatured),
                    eq(matchesTable.tournamentId, finalTournament.id),
                  ),
                )
            : [undefined];
          await tx.insert(actionLogTable).values({
            tournamentId: finalTournament.id,
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
        return { tournament: finalTournament, gameConfig: updatedGameConfig };
      },
    );
    res.json(
      mapTournament(
        result.tournament,
        result.gameConfig === undefined
          ? await loadTournamentGameConfig(result.tournament.id)
          : result.gameConfig,
      ),
    );
  } catch (error) {
    if (error instanceof TournamentGameConfigImmutableError) {
      res.status(409).json({ error: error.message, code: error.code });
      return;
    }
    if (error instanceof TournamentGameConfigError) {
      res.status(400).json({ error: error.message, code: error.code });
      return;
    }
    throw error;
  }
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
    .select({
      id: tournamentStagesTable.id,
      format: tournamentStagesTable.format,
      entrySeedingPolicy: tournamentStagesTable.entrySeedingPolicy,
    })
    .from(tournamentStagesTable)
    .where(eq(tournamentStagesTable.tournamentId, tournament.id))
    .orderBy(tournamentStagesTable.position);
  const [startGameConfig] = stages.length === 1 && stages[0]?.format === "group_stage"
    ? await db
      .select({ gameId: tournamentGameConfigsTable.gameId })
      .from(tournamentGameConfigsTable)
      .where(eq(tournamentGameConfigsTable.tournamentId, tournament.id))
    : [];
  if (shouldUseStageLifecycleForLegacyTournamentStart(
    stages,
    startGameConfig?.gameId ?? null,
    tournament.basketFlowAuthorityVersion,
  )) {
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
      res.json(await mapTournamentWithGameConfig(updated));
    } catch (error) {
      if (error instanceof StageLifecycleError) {
        sendStageLifecycleError(error, res);
        return;
      }
      if (error instanceof MarvelEliminationStageError) {
        sendMarvelEliminationError(error, res);
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
      const basketConfiguration = await loadStageBasketConfigurationInTransaction(
        tx,
        lockedTournament.id,
      );
      if (!basketConfiguration.validation.valid) {
        throw new Error("STAGE_BASKET_CONFIGURATION_INVALID");
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
      if (memberships.some((membership, index) => membership.stageSeed !== index + 1)) {
        throw new Error("STAGE_PARTICIPANTS_INCONSISTENT");
      }
      const existingMatches = await tx
        .select({ id: matchesTable.id })
        .from(matchesTable)
        .where(eq(matchesTable.stageId, stage.id))
        .for("update");
      if (existingMatches.length > 0) {
        throw new Error("MATCHES_ALREADY_EXIST");
      }
      const stagePlayers = memberships.map((membership) => ({
        ...playersById.get(membership.playerId)!,
        seed: membership.stageSeed,
      }));

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
    res.json(await mapTournamentWithGameConfig(updated));
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
      MATCHES_ALREADY_EXIST: "Tournament stage already contains matches",
      STAGE_BASKET_CONFIGURATION_INVALID: "Tournament stage basket configuration is invalid",
    };
    const status = code === "TOURNAMENT_NOT_FOUND"
      ? 404
      : code === "MATCHES_ALREADY_EXIST"
        ? 409
      : code === "STAGE_BASKET_CONFIGURATION_INVALID"
        ? 422
        : 400;
    res.status(status).json({
      error: messages[code] ?? "Could not start tournament",
      code,
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
    res.json(await mapTournamentWithGameConfig(updated));
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

  res.json({
    tournament: await mapTournamentWithGameConfig(tournament),
    rounds,
    winner,
  });
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

  const topPlayers = (await calculateStandings(players, matches, tournament))
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

  const standings = await calculateStandings(players, matches, tournament);
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

  // Enrich with per-game picks (Deadlock tournaments)
  const historyMatchIds = [...new Set(history.map((h) => h.matchId).filter(Boolean))] as number[];
  const gamePicks =
    historyMatchIds.length > 0
      ? await db
          .select()
          .from(matchGamePicksTable)
          .where(inArray(matchGamePicksTable.matchId, historyMatchIds))
      : [];
  // Group picks by matchId
  const picksByMatchId = new Map<number, Array<{ gameNumber: number; player1HeroId: string | null; player2HeroId: string | null }>>();
  for (const p of gamePicks) {
    const arr = picksByMatchId.get(p.matchId) ?? [];
    arr.push({ gameNumber: p.gameNumber, player1HeroId: p.player1HeroId ?? null, player2HeroId: p.player2HeroId ?? null });
    picksByMatchId.set(p.matchId, arr);
  }

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
      gamePicks: (h.matchId ? (picksByMatchId.get(h.matchId) ?? []) : []).sort((a, b) => a.gameNumber - b.gameNumber),
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

  // Never infer eligibility to start a stage from participant counts alone.
  // Reuse the authoritative read-only stage-start readiness implementation.
  const [players, matches, stages] = await Promise.all([
    db.select().from(playersTable).where(eq(playersTable.tournamentId, tournament.id)),
    db.select().from(matchesTable).where(eq(matchesTable.tournamentId, tournament.id)),
    db.select().from(tournamentStagesTable).where(eq(tournamentStagesTable.tournamentId, tournament.id)),
  ]);
  const activeStage = stages.find(stage => stage.status === "active");
  const plannedStage = !activeStage && [...stages]
    .filter(stage => stage.status === "planned")
    .sort((a, b) => a.position - b.position)[0];
  let plannedStageReadiness: {ready: boolean; reasonCode: string; message: string} | null = null;
  if (plannedStage && (tournament.status === "draft" || tournament.status === "active")) {
    try {
      plannedStageReadiness = await getStageStartReadiness({
        tournamentId: tournament.id,
        stageId: plannedStage.id,
      });
    } catch (error) {
      if (!(error instanceof StageLifecycleError)) throw error;
      plannedStageReadiness = {ready: false, reasonCode: error.code, message: error.message};
    }
  }
  const operationsInput = { tournament, players, stages, matches, plannedStageReadiness };
  const operations = deriveTournamentOperations(operationsInput);
  const transitionPreview = deriveTournamentProgressionPreflight(operationsInput, operations);
  res.json({
    stepTitle: operations.recommendedAction.title,
    nextAction: operations.recommendedAction.description,
    warnings: operations.blockers.map(blocker => blocker.message),
    operations: { ...operations, transitionPreview },
  });
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

/**
 * MP2A: reject candidates selected before the tournament mutation lock if a
 * newer undoable action committed while the request was waiting. Both generic
 * Undo and revert_match must call this inside that same locked transaction.
 */
async function lockLatestUndoableAction(
  tx: RouteTransaction,
  tournamentId: number,
  candidate: typeof actionLogTable.$inferSelect,
): Promise<typeof actionLogTable.$inferSelect> {
  const [lockedAction] = await tx
    .select()
    .from(actionLogTable)
    .where(and(
      eq(actionLogTable.id, candidate.id),
      eq(actionLogTable.tournamentId, tournamentId),
    ))
    .for("update");
  if (
    !lockedAction ||
    lockedAction.isUndone ||
    !lockedAction.undoPayload ||
    lockedAction.actionType !== candidate.actionType ||
    lockedAction.undoPayload !== candidate.undoPayload ||
    lockedAction.matchId !== candidate.matchId ||
    lockedAction.createdAt.getTime() !== candidate.createdAt.getTime()
  ) {
    throw new RevertMatchError("UNDO_ACTION_CHANGED");
  }

  const [latestUndoable] = await tx
    .select({ id: actionLogTable.id })
    .from(actionLogTable)
    .where(and(
      eq(actionLogTable.tournamentId, tournamentId),
      eq(actionLogTable.isUndone, false),
      sql`${actionLogTable.undoPayload} IS NOT NULL`,
    ))
    .orderBy(desc(actionLogTable.createdAt), desc(actionLogTable.id))
    .limit(1);
  if (latestUndoable?.id !== lockedAction.id) {
    throw new RevertMatchError("UNDO_ACTION_CHANGED");
  }
  return lockedAction;
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
    "STAGE_QUALIFICATION_ALREADY_COMMITTED",
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
      // Pass the locked transaction to RevertMatch; otherwise an independent
      // transaction would release global LIFO protection before the result reset.
      const result = await withTournamentMutationLock(
        params.data.id,
        mutationActor,
        async (tx) => {
          await lockLatestUndoableAction(tx, params.data.id, lastAction);
          return revertMatch({
            matchId,
            expectedTournamentId: params.data.id,
            expectedCompletionActionId: lastAction.id,
            actor: mutationActor,
          }, {}, tx);
        },
      );
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
        const lockedAction = await lockLatestUndoableAction(
          tx, params.data.id, lastAction,
        );
        const lockedPayload = JSON.parse(lockedAction.undoPayload!) as Record<string, unknown>;
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
            // Also restore hero picks and sides (swap is symmetric — same SQL restores original values)
            await tx
              .update(matchGamePicksTable)
              .set({
                player1HeroId: matchGamePicksTable.player2HeroId,
                player2HeroId: matchGamePicksTable.player1HeroId,
                player1Side: sql`CASE player1_side
                  WHEN 'archmother' THEN 'hidden_king'
                  WHEN 'hidden_king' THEN 'archmother'
                  ELSE player1_side END`,
                updatedAt: new Date(),
              })
              .where(eq(matchGamePicksTable.matchId, matchId));
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
      const status = error.code === "MATCH_ALREADY_FINALIZED" || error.code === "CONCURRENT_MODIFICATION"
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
      // Atomically swap hero picks and sides for all games in this match
      await tx
        .update(matchGamePicksTable)
        .set({
          player1HeroId: matchGamePicksTable.player2HeroId,
          player2HeroId: matchGamePicksTable.player1HeroId,
          player1Side: sql`CASE player1_side
            WHEN 'archmother' THEN 'hidden_king'
            WHEN 'hidden_king' THEN 'archmother'
            ELSE player1_side END`,
          updatedAt: new Date(),
        })
        .where(eq(matchGamePicksTable.matchId, params.data.id));
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
  let {
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
  if (parsedBackup.schemaVersion === 3) {
    const rawTournament = ownValue(rawBackup, "tournament");
    const rawGameConfig = ownValue(rawTournament, "gameConfig");
    if (rawGameConfig !== undefined) {
      parsedBackup = {
        ...parsedBackup,
        tournament: {
          ...parsedBackup.tournament,
          gameConfig: rawGameConfig,
        },
      } as TournamentBackupV3;
    }
  }

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
      ? {
          ...await importBackupV2(parsedBackup as TournamentBackupV2, credentials),
          gameConfig: null,
        }
      : await importBackupV3(parsedBackup as TournamentBackupV3, credentials);
    res.status(201).json({
      tournament: mapTournament(imported.tournament, imported.gameConfig),
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

// ---------------------------------------------------------------------------
// Deadlock hero bans per player
// ---------------------------------------------------------------------------

function parsePositiveInt(val: unknown): number | null {
  const n = Number(val);
  return Number.isInteger(n) && n > 0 ? n : null;
}
function isValidHeroId(v: unknown): v is string {
  return typeof v === "string" && v.length >= 1 && v.length <= 64;
}

/** Return all player bans for a tournament (readable by anyone with read access). */
router.get("/tournaments/:id/player-bans", async (req, res): Promise<void> => {
  const tid = parsePositiveInt(req.params.id);
  if (!tid) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await checkViewerReadAuth(req, res, tid)) return;

  const bans = await db
    .select()
    .from(playerDeadlockBansTable)
    .where(eq(playerDeadlockBansTable.tournamentId, tid));

  res.json(
    bans.map((b) => ({
      playerId: b.playerId,
      tournamentId: b.tournamentId,
      bannedHeroIds: b.bannedHeroIds ?? [],
    })),
  );
});

/** Set or replace bans for a player (organizer / support only). */
router.put("/players/:id/bans", async (req, res): Promise<void> => {
  const pid = parsePositiveInt(req.params.id);
  if (!pid) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = req.body as { bannedHeroIds?: unknown };
  if (!Array.isArray(body.bannedHeroIds) || !body.bannedHeroIds.every(isValidHeroId)) {
    res.status(422).json({ error: "bannedHeroIds must be an array of non-empty strings" }); return;
  }
  const bannedHeroIds = body.bannedHeroIds as string[];

  const [player] = await db
    .select({ tournamentId: playersTable.tournamentId })
    .from(playersTable)
    .where(eq(playersTable.id, pid));
  if (!player) { res.status(404).json({ error: "Player not found" }); return; }

  const access = await requireTournamentWrite(req, res, player.tournamentId);
  if (!access) return;

  // Enforce configured bansPerPlayer limit from game config
  const gameConfig = await loadTournamentGameConfig(player.tournamentId);
  if (gameConfig?.gameId === "deadlock") {
    const configuredLimit = getDeadlockBansPerPlayer(gameConfig.config);
    if (bannedHeroIds.length > configuredLimit) {
      res.status(422).json({ error: `bannedHeroIds exceeds the configured limit of ${configuredLimit} bans per player` }); return;
    }
  } else if (gameConfig?.gameId === "marvel") {
    res.status(422).json({ error: "Hero bans are not available for Marvel tournaments" });
    return;
  } else {
    // Default limit of 5 when no game config
    if (bannedHeroIds.length > 5) {
      res.status(422).json({ error: "bannedHeroIds must be an array of up to 5 non-empty strings" }); return;
    }
  }

  const [upserted] = await db
    .insert(playerDeadlockBansTable)
    .values({ playerId: pid, tournamentId: player.tournamentId, bannedHeroIds })
    .onConflictDoUpdate({
      target: playerDeadlockBansTable.playerId,
      set: { bannedHeroIds, updatedAt: new Date() },
    })
    .returning();

  res.json({
    playerId: upserted.playerId,
    tournamentId: upserted.tournamentId,
    bannedHeroIds: upserted.bannedHeroIds ?? [],
  });
});

// ---------------------------------------------------------------------------
// Per-game hero picks inside a BO match series
// ---------------------------------------------------------------------------

/** Return all game picks for a match. */
router.get("/matches/:id/game-picks", async (req, res): Promise<void> => {
  const mid = parsePositiveInt(req.params.id);
  if (!mid) { res.status(400).json({ error: "Invalid id" }); return; }

  const [matchRef] = await db
    .select({ tournamentId: matchesTable.tournamentId })
    .from(matchesTable)
    .where(eq(matchesTable.id, mid));
  if (!matchRef) { res.status(404).json({ error: "Match not found" }); return; }
  if (!await checkViewerReadAuth(req, res, matchRef.tournamentId)) return;

  const picks = await db
    .select()
    .from(matchGamePicksTable)
    .where(eq(matchGamePicksTable.matchId, mid));

  res.json(
    picks.map((p) => ({
      matchId: p.matchId,
      gameNumber: p.gameNumber,
      player1HeroId: p.player1HeroId ?? null,
      player2HeroId: p.player2HeroId ?? null,
      player1Side: (p.player1Side as "archmother" | "hidden_king" | null) ?? null,
      player2Side: p.player1Side === "archmother" ? "hidden_king" : p.player1Side === "hidden_king" ? "archmother" : null,
    })),
  );
});

/** Upsert hero picks for one game in a match series. */
router.put("/matches/:id/game-picks/:gameNumber", async (req, res): Promise<void> => {
  const mid = parsePositiveInt(req.params.id);
  const gn = parsePositiveInt(req.params.gameNumber);
  if (!mid || !gn || gn > 5) { res.status(400).json({ error: "Invalid params" }); return; }
  const body = req.body as { player1HeroId?: unknown; player2HeroId?: unknown; player1Side?: unknown };
  const p1Raw = body.player1HeroId;
  const p2Raw = body.player2HeroId;
  const sideRaw = body.player1Side;
  if (p1Raw !== undefined && p1Raw !== null && !isValidHeroId(p1Raw)) { res.status(422).json({ error: "Invalid player1HeroId" }); return; }
  if (p2Raw !== undefined && p2Raw !== null && !isValidHeroId(p2Raw)) { res.status(422).json({ error: "Invalid player2HeroId" }); return; }
  if (sideRaw !== undefined && sideRaw !== null && sideRaw !== "archmother" && sideRaw !== "hidden_king") {
    res.status(422).json({ error: "player1Side must be 'archmother', 'hidden_king', or null." });
    return;
  }

  const [matchRef] = await db
    .select({
      tournamentId: matchesTable.tournamentId,
      stageId: matchesTable.stageId,
      bestOf: matchesTable.bestOf,
      player1Id: matchesTable.player1Id,
      player2Id: matchesTable.player2Id,
    })
    .from(matchesTable)
    .where(eq(matchesTable.id, mid));
  if (!matchRef) { res.status(404).json({ error: "Match not found" }); return; }

  const access = await requireTournamentWrite(req, res, matchRef.tournamentId);
  if (!access) return;

  const p1 = (p1Raw as string | null | undefined) ?? null;
  const p2 = (p2Raw as string | null | undefined) ?? null;
  const side = (sideRaw as "archmother" | "hidden_king" | null | undefined) ?? undefined;

  // Server-side validation: ban checks + player1Side Deadlock-only guard
  const playerIds = [matchRef.player1Id, matchRef.player2Id].filter((id): id is number => id !== null && id !== undefined);
  const needsGameConfig = playerIds.length === 2 || (side !== undefined && side !== null);
  let resolvedGameConfig: Awaited<ReturnType<typeof loadTournamentGameConfig>> | undefined;
  if (needsGameConfig) {
    type BanRow = typeof playerDeadlockBansTable.$inferSelect;
    const matchGameConfig = await loadTournamentGameConfig(matchRef.tournamentId);
    resolvedGameConfig = matchGameConfig;
    const banRows: BanRow[] = playerIds.length === 2
      ? await db.select().from(playerDeadlockBansTable).where(inArray(playerDeadlockBansTable.playerId, playerIds))
      : [];
    // Validate player1Side is only used for Deadlock tournaments
    if (side !== undefined && side !== null && matchGameConfig?.gameId !== "deadlock") {
      res.status(422).json({ error: "player1Side is only valid for Deadlock tournaments." });
      return;
    }
    if (playerIds.length === 2) {
      const p1Bans = banRows.find((b) => b.playerId === matchRef.player1Id)?.bannedHeroIds ?? [];
      const p2Bans = banRows.find((b) => b.playerId === matchRef.player2Id)?.bannedHeroIds ?? [];
      const banMode = matchGameConfig?.gameId === "deadlock"
        ? getDeadlockBanMode(matchGameConfig.config)
        : "shared_pool";
      const stageRows = matchGameConfig?.gameId === "deadlock"
        ? await db.select({ id: tournamentStagesTable.id, stageKey: tournamentStagesTable.stageKey })
          .from(tournamentStagesTable)
          .where(eq(tournamentStagesTable.tournamentId, matchRef.tournamentId))
          .orderBy(tournamentStagesTable.position)
        : [];
      const matchStageKey = stageRows.find((stage) => stage.id === matchRef.stageId)?.stageKey;
      const effectiveStageBans = matchGameConfig?.gameId === "deadlock" && matchStageKey
        ? getDeadlockEffectiveStageBans(
            matchGameConfig.config,
            stageRows.map((stage) => stage.stageKey),
            matchStageKey,
          )
        : [];
      const effectiveStageBanSet = new Set<string>(effectiveStageBans);

      if (banMode === "shared_pool") {
        const forbidden = new Set([...p1Bans, ...p2Bans, ...effectiveStageBans]);
        if (p1 !== null && forbidden.has(p1)) {
          res.status(422).json({ error: `Postać "${p1}" jest zbanowana i nie może być wybrana w tym meczu.` });
          return;
        }
        if (p2 !== null && forbidden.has(p2)) {
          res.status(422).json({ error: `Postać "${p2}" jest zbanowana i nie może być wybrana w tym meczu.` });
          return;
        }
      } else {
        // opponent_only: each player is blocked only by their opponent's bans
        if (p1 !== null && (p2Bans.includes(p1) || effectiveStageBanSet.has(p1))) {
          res.status(422).json({ error: `Postać "${p1}" jest zbanowana przez przeciwnika i nie może być wybrana w tym meczu.` });
          return;
        }
        if (p2 !== null && (p1Bans.includes(p2) || effectiveStageBanSet.has(p2))) {
          res.status(422).json({ error: `Postać "${p2}" jest zbanowana przez przeciwnika i nie może być wybrana w tym meczu.` });
          return;
        }
      }
    }
  }
  void resolvedGameConfig; // consumed above

  const sideForInsert = side !== undefined ? side : null;
  const [upserted] = await db
    .insert(matchGamePicksTable)
    .values({
      matchId: mid,
      gameNumber: gn,
      player1HeroId: p1,
      player2HeroId: p2,
      player1Side: sideForInsert,
    })
    .onConflictDoUpdate({
      target: [matchGamePicksTable.matchId, matchGamePicksTable.gameNumber],
      set: {
        player1HeroId: p1,
        player2HeroId: p2,
        ...(side !== undefined ? { player1Side: side } : {}),
        updatedAt: new Date(),
      },
    })
    .returning();

  const storedSide = (upserted.player1Side as "archmother" | "hidden_king" | null) ?? null;
  res.json({
    matchId: upserted.matchId,
    gameNumber: upserted.gameNumber,
    player1HeroId: upserted.player1HeroId ?? null,
    player2HeroId: upserted.player2HeroId ?? null,
    player1Side: storedSide,
    player2Side: storedSide === "archmother" ? "hidden_king" : storedSide === "hidden_king" ? "archmother" : null,
  });
});

export default router;
