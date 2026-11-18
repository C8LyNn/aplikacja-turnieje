import { bestOfForMatchRules, describeMatchRules, matchRulesFromStorage, parseMatchRules, validateMatchRulesForStage } from "@workspace/match-rules";
/**
 * V5.3 — league endpoints: rules before a stage starts, the round-by-round schedule, the schedule
 * generator and per-match dates. Results are never touched here: dates and rules are separate from
 * CompleteMatch/RevertMatch, and match revisions are not bumped by a date change.
 */
import { Router, type IRouter, type Response } from "express";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  actionLogTable,
  db,
  matchesTable,
  playersTable,
  stageParticipantsTable,
  tournamentStagesTable, tournamentsTable,
} from "@workspace/db";
import {
  GenerateStageScheduleBody,
  GenerateStageScheduleParams,
  GetStageScheduleParams,
  UpdateMatchScheduleBody,
  UpdateMatchScheduleParams,
  UpdateStageLeagueRulesBody,
  UpdateStageLeagueRulesParams,
  UpdateStageMatchRulesParams,
} from "@workspace/api-zod";
import {
  getTournamentMutationActor,
  requireOrganizer,
  requireTournamentRead,
  requireTournamentWrite,
  TournamentMutationAuthorizationError,
  withTournamentMutationLock,
} from "../access-policy";
import {
  describeLeagueRules,
  isLeagueDraw,
  leagueRulesFromStorage,
  parseLeagueRules,
  validateLeagueRulesForStage,
} from "../domain/tournament/league-rules";
import {
  DEFAULT_SCHEDULE_TIME_ZONE,
  generateRoundDates,
  instantToLocal,
  isValidTimeZone,
  localDateTimeToInstant,
  restingParticipantsByRound,
  scheduleStateOf,
} from "../domain/tournament/league-schedule";
import { serializeTournamentStage } from "../application/stages/stage-queries";
import { enrichMatches } from "./tournaments";

const router: IRouter = Router();

class LeagueRouteError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function sendError(res: Response, error: unknown): void {
  if (error instanceof LeagueRouteError) {
    res.status(error.status).json({ error: error.message, code: error.code });
    return;
  }
  if (error instanceof TournamentMutationAuthorizationError) {
    res.status(403).json({ error: "Brak uprawnień do zmiany tego turnieju.", code: "FORBIDDEN" });
    return;
  }
  throw error;
}

/** Stage row plus a plain-language rules summary (shared serializer). */
export const serializeLeagueStage = serializeTournamentStage;

const SCHEDULE_FORMATS = new Set(["round_robin", "group_stage"]);

// ---------- league rules (before start) ----------

router.put("/tournaments/:id/stages/:stageId/league-rules", async (req, res): Promise<void> => {
  const params = UpdateStageLeagueRulesParams.safeParse(req.params);
  const body = UpdateStageLeagueRulesBody.safeParse(req.body);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!body.success) { res.status(422).json({ error: body.error.message, code: "INVALID_LEAGUE_RULES" }); return; }
  const access = await requireOrganizer(req, res, params.data.id);
  if (!access) return;
  try {
    const updated = await withTournamentMutationLock(params.data.id, getTournamentMutationActor(access), async (tx) => {
      const [stage] = await tx.select().from(tournamentStagesTable)
        .where(and(eq(tournamentStagesTable.id, params.data.stageId), eq(tournamentStagesTable.tournamentId, params.data.id)))
        .for("update");
      if (!stage) throw new LeagueRouteError(404, "STAGE_NOT_FOUND", "Etap nie istnieje.");
      if (stage.status !== "planned") {
        throw new LeagueRouteError(409, "STAGE_ALREADY_STARTED", "Zasady ligi można zmienić tylko przed rozpoczęciem etapu — rozegrane wyniki nie są przeliczane wstecz.");
      }
      if (stage.version !== body.data.expectedVersion) {
        throw new LeagueRouteError(409, "STAGE_VERSION_CONFLICT", "Etap zmienił się w międzyczasie. Odśwież i spróbuj ponownie.");
      }
      const parsed = parseLeagueRules(req.body.leagueRules);
      if (!parsed.ok) {
        throw new LeagueRouteError(422, "INVALID_LEAGUE_RULES", parsed.problems.map((problem) => problem.message).join(" "));
      }
      const problems = validateLeagueRulesForStage(parsed.value, stage);
      if (problems.length > 0) {
        throw new LeagueRouteError(422, problems[0]!.code, problems.map((problem) => problem.message).join(" "));
      }
      if (parsed.value?.allowDraws && matchRulesFromStorage(stage.matchRules)) {
        throw new LeagueRouteError(422, "MATCH_RULES_DRAWS_CONFLICT", "Ten etap rozstrzyga mecze setami, więc remis nie jest możliwy — najpierw zmień zasady meczu.");
      }
      const [saved] = await tx.update(tournamentStagesTable)
        .set({ leagueRules: parsed.value, version: stage.version + 1 })
        .where(eq(tournamentStagesTable.id, stage.id))
        .returning();
      await tx.insert(actionLogTable).values({
        tournamentId: stage.tournamentId,
        stageId: stage.id,
        actionType: "league_rules_changed",
        description: parsed.value
          ? `Zasady etapu „${stage.name}”: ${describeLeagueRules(parsed.value)}`
          : `Etap „${stage.name}”: przywrócono klasyfikację według liczby zwycięstw (bez punktów).`,
        undoPayload: null,
        isUndone: false,
      });
      return saved!;
    });
    res.json(serializeLeagueStage(updated));
  } catch (error) {
    sendError(res, error);
  }
});

// ---------- match rules (V5.7) ----------

router.put("/tournaments/:id/stages/:stageId/match-rules", async (req, res): Promise<void> => {
  const params = UpdateStageMatchRulesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const expectedVersion = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>).expectedVersion : undefined;
  if (typeof expectedVersion !== "number" || !Number.isSafeInteger(expectedVersion)) {
    res.status(422).json({ error: "Brakuje wersji etapu (expectedVersion).", code: "INVALID_MATCH_RULES" });
    return;
  }
  const access = await requireOrganizer(req, res, params.data.id);
  if (!access) return;
  try {
    const updated = await withTournamentMutationLock(params.data.id, getTournamentMutationActor(access), async (tx) => {
      const [stage] = await tx.select().from(tournamentStagesTable)
        .where(and(eq(tournamentStagesTable.id, params.data.stageId), eq(tournamentStagesTable.tournamentId, params.data.id)))
        .for("update");
      if (!stage) throw new LeagueRouteError(404, "STAGE_NOT_FOUND", "Etap nie istnieje.");
      // Policy: rules change only before the stage starts; played results are never recalculated.
      if (stage.status !== "planned") {
        throw new LeagueRouteError(409, "MATCH_RULES_LOCKED", "Zasady meczu można zmienić tylko przed rozpoczęciem etapu — rozegrane wyniki nie są przeliczane według nowych zasad.");
      }
      if (stage.version !== expectedVersion) {
        throw new LeagueRouteError(409, "STAGE_VERSION_CONFLICT", "Etap zmienił się w międzyczasie. Odśwież i spróbuj ponownie.");
      }
      const parsed = parseMatchRules((req.body as Record<string, unknown>).matchRules);
      if (!parsed.ok) throw new LeagueRouteError(422, parsed.problems[0]!.code, parsed.problems.map((problem) => problem.message).join(" "));
      const leagueRules = leagueRulesFromStorage(stage.leagueRules);
      // The match length follows the rules (sets to win), so the stage best-of moves with them.
      const bestOf = parsed.value ? bestOfForMatchRules(parsed.value) : stage.bestOf;
      const problems = validateMatchRulesForStage(parsed.value, { format: stage.format, bestOf, allowDraws: !!leagueRules?.allowDraws });
      if (problems.length) throw new LeagueRouteError(422, problems[0]!.code, problems.map((problem) => problem.message).join(" "));
      const [saved] = await tx.update(tournamentStagesTable)
        .set({ matchRules: parsed.value, bestOf, version: stage.version + 1 })
        .where(eq(tournamentStagesTable.id, stage.id))
        .returning();
      // The first stage's length mirrors the tournament's compatibility column (kept in sync at start).
      if (stage.position === 1) {
        await tx.update(tournamentsTable).set({ defaultBestOf: bestOf }).where(eq(tournamentsTable.id, stage.tournamentId));
      }
      await tx.insert(actionLogTable).values({
        tournamentId: stage.tournamentId,
        stageId: stage.id,
        actionType: "match_rules_changed",
        description: `Zasady meczu w etapie „${stage.name}”: ${describeMatchRules(parsed.value, { bestOf, allowDraws: !!leagueRules?.allowDraws })}`,
        undoPayload: null,
        isUndone: false,
      });
      return saved!;
    });
    res.json(serializeLeagueStage(updated));
  } catch (error) {
    sendError(res, error);
  }
});

// ---------- schedule (read) ----------

router.get("/tournaments/:id/stages/:stageId/schedule", async (req, res): Promise<void> => {
  const params = GetStageScheduleParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!await requireTournamentRead(req, res, params.data.id)) return;
  const [stage] = await db.select().from(tournamentStagesTable)
    .where(and(eq(tournamentStagesTable.id, params.data.stageId), eq(tournamentStagesTable.tournamentId, params.data.id)));
  if (!stage) { res.status(404).json({ error: "Etap nie istnieje.", code: "STAGE_NOT_FOUND" }); return; }

  const [matches, members] = await Promise.all([
    db.select().from(matchesTable).where(eq(matchesTable.stageId, stage.id))
      .orderBy(asc(matchesTable.round), asc(matchesTable.matchNumber)),
    db.select({ playerId: stageParticipantsTable.playerId, groupId: stageParticipantsTable.groupId })
      .from(stageParticipantsTable).where(eq(stageParticipantsTable.stageId, stage.id))
      .orderBy(asc(stageParticipantsTable.stageSeed)),
  ]);
  const playerIds = [...new Set(members.map((member) => member.playerId))];
  const players = playerIds.length
    ? await db.select({ id: playersTable.id, name: playersTable.name }).from(playersTable).where(inArray(playersTable.id, playerIds))
    : [];
  const names = new Map(players.map((player) => [player.id, player.name]));
  const timeZone = stage.scheduleTimeZone ?? DEFAULT_SCHEDULE_TIME_ZONE;
  const now = new Date();

  const view = matches.map((match) => {
    const local = match.scheduledAt ? instantToLocal(match.scheduledAt, timeZone) : null;
    return {
      matchId: match.id,
      revision: match.revision,
      round: match.round,
      matchNumber: match.matchNumber,
      player1Id: match.player1Id ?? null,
      player2Id: match.player2Id ?? null,
      player1Name: match.player1Id == null ? null : names.get(match.player1Id) ?? null,
      player2Name: match.player2Id == null ? null : names.get(match.player2Id) ?? null,
      status: match.status,
      scheduleState: scheduleStateOf(match, now, timeZone),
      scheduledAt: match.scheduledAt ? match.scheduledAt.toISOString() : null,
      localDate: local?.date ?? null,
      localTime: local?.time ?? null,
      score1: match.score1 ?? null,
      score2: match.score2 ?? null,
      winnerId: match.winnerId ?? null,
      isDraw: isLeagueDraw(match),
      groupId: match.stageGroupId ?? null,
    };
  });

  // Resting participants: per group in group stages, otherwise across the whole league.
  const resting = new Map<number, number[]>();
  const groupIds = [...new Set(members.map((member) => member.groupId ?? -1))];
  for (const groupId of groupIds) {
    const groupMembers = members.filter((member) => (member.groupId ?? -1) === groupId).map((member) => member.playerId);
    const groupMatches = matches.filter((match) => (match.stageGroupId ?? -1) === groupId);
    for (const [round, idle] of restingParticipantsByRound(groupMembers, groupMatches)) {
      resting.set(round, [...(resting.get(round) ?? []), ...idle]);
    }
  }

  const roundNumbers = [...new Set(view.map((match) => match.round))].sort((left, right) => left - right);
  const unfinished = (state: string) => state !== "completed" && state !== "cancelled";
  const rounds = roundNumbers.map((round) => {
    const roundMatches = view.filter((match) => match.round === round);
    const dates = roundMatches.map((match) => match.localDate).filter((date): date is string => date != null).sort();
    return {
      round,
      matches: roundMatches.map(({ groupId: _groupId, ...match }) => match),
      resting: (resting.get(round) ?? []).map((playerId) => ({ playerId, name: names.get(playerId) ?? `#${playerId}` })),
      completed: roundMatches.filter((match) => match.scheduleState === "completed").length,
      total: roundMatches.length,
      firstDate: dates[0] ?? null,
    };
  });
  const currentRound = rounds.find((round) => round.matches.some((match) => unfinished(match.scheduleState)))?.round ?? null;
  const strip = ({ groupId: _groupId, ...match }: (typeof view)[number]) => match;
  const upcoming = view
    .filter((match) => match.scheduleState === "scheduled")
    .sort((left, right) => left.scheduledAt!.localeCompare(right.scheduledAt!) || left.round - right.round || left.matchNumber - right.matchNumber)
    .slice(0, 8)
    .map(strip);
  const overdue = view
    .filter((match) => match.scheduleState === "awaiting_result")
    .sort((left, right) => left.scheduledAt!.localeCompare(right.scheduledAt!))
    .map(strip);
  const count = (state: string) => view.filter((match) => match.scheduleState === state).length;
  res.json({
    stageId: stage.id,
    stageName: stage.name,
    format: stage.format,
    timeZone,
    timeZoneSource: stage.scheduleTimeZone ? "stage" : "default",
    now: now.toISOString(),
    currentRound,
    rounds,
    upcoming,
    overdue,
    counts: {
      scheduled: count("scheduled"),
      due: count("due"),
      inProgress: count("in_progress"),
      awaitingResult: count("awaiting_result"),
      completed: count("completed"),
      postponed: count("postponed"),
      unscheduled: count("unscheduled"),
      total: view.length,
    },
  });
});

// ---------- schedule generator ----------

router.post("/tournaments/:id/stages/:stageId/schedule/generate", async (req, res): Promise<void> => {
  const params = GenerateStageScheduleParams.safeParse(req.params);
  const body = GenerateStageScheduleBody.safeParse(req.body);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!body.success) { res.status(422).json({ error: body.error.message, code: "INVALID_SCHEDULE_INPUT" }); return; }
  const access = await requireOrganizer(req, res, params.data.id);
  if (!access) return;
  const input = body.data;
  if (!isValidTimeZone(input.timeZone)) {
    res.status(422).json({ error: "Nieznana strefa czasowa.", code: "INVALID_TIME_ZONE" });
    return;
  }
  try {
    const result = await withTournamentMutationLock(params.data.id, getTournamentMutationActor(access), async (tx) => {
      const [stage] = await tx.select().from(tournamentStagesTable)
        .where(and(eq(tournamentStagesTable.id, params.data.stageId), eq(tournamentStagesTable.tournamentId, params.data.id)))
        .for("update");
      if (!stage) throw new LeagueRouteError(404, "STAGE_NOT_FOUND", "Etap nie istnieje.");
      if (!SCHEDULE_FORMATS.has(stage.format)) {
        throw new LeagueRouteError(422, "SCHEDULE_FORMAT_UNSUPPORTED", "Terminarz kolejek działa w lidze i w fazie grupowej.");
      }
      if (stage.version !== input.expectedVersion) {
        throw new LeagueRouteError(409, "STAGE_VERSION_CONFLICT", "Etap zmienił się w międzyczasie. Odśwież i spróbuj ponownie.");
      }
      const matches = await tx.select().from(matchesTable).where(eq(matchesTable.stageId, stage.id))
        .orderBy(asc(matchesTable.round), asc(matchesTable.matchNumber)).for("update");
      if (matches.length === 0) {
        throw new LeagueRouteError(422, "NO_ROUNDS", "Mecze powstaną po rozpoczęciu etapu — wtedy ułożysz terminarz.");
      }
      const roundCount = Math.max(...matches.map((match) => match.round));
      const generated = generateRoundDates(input, roundCount);
      if (!generated.ok) throw new LeagueRouteError(422, generated.code, generated.message);
      const slotByRound = new Map(generated.rounds.map((round) => [round.round, round]));

      const eligible = matches.filter((match) => match.status !== "completed" && match.status !== "cancelled"
        && !(input.onlyUnscheduled && match.scheduledAt != null));
      const skippedMatches = matches.length - eligible.length;
      if (input.apply) {
        for (const match of eligible) {
          await tx.update(matchesTable).set({ scheduledAt: slotByRound.get(match.round)!.scheduledAt })
            .where(eq(matchesTable.id, match.id));
        }
        await tx.update(tournamentStagesTable)
          .set({ scheduleTimeZone: input.timeZone, version: stage.version + 1 })
          .where(eq(tournamentStagesTable.id, stage.id));
        await tx.insert(actionLogTable).values({
          tournamentId: stage.tournamentId,
          stageId: stage.id,
          actionType: "schedule_generated",
          description: `Terminarz etapu „${stage.name}”: ${roundCount} kolejek od ${input.startDate}, co ${input.intervalDays} dni, godz. ${input.defaultTime} (${input.timeZone}); ustawiono ${eligible.length} meczów.`,
          undoPayload: null,
          isUndone: false,
        });
      }
      return {
        applied: input.apply,
        timeZone: input.timeZone,
        rounds: generated.rounds.map((round) => ({
          round: round.round,
          date: round.date,
          time: round.time,
          scheduledAt: round.scheduledAt.toISOString(),
          matchCount: matches.filter((match) => match.round === round.round).length,
        })),
        updatedMatches: input.apply ? eligible.length : 0,
        skippedMatches,
        firstDate: generated.rounds[0]?.date ?? null,
        lastDate: generated.rounds.at(-1)?.date ?? null,
      };
    });
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

// ---------- one match date ----------

router.put("/matches/:id/schedule", async (req, res): Promise<void> => {
  const params = UpdateMatchScheduleParams.safeParse(req.params);
  const body = UpdateMatchScheduleBody.safeParse(req.body);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!body.success) { res.status(422).json({ error: body.error.message, code: "INVALID_SCHEDULE_INPUT" }); return; }
  const [reference] = await db.select({ tournamentId: matchesTable.tournamentId }).from(matchesTable)
    .where(eq(matchesTable.id, params.data.id));
  if (!reference) { res.status(404).json({ error: "Mecz nie istnieje.", code: "MATCH_NOT_FOUND" }); return; }
  const access = await requireTournamentWrite(req, res, reference.tournamentId);
  if (!access) return;
  try {
    const saved = await withTournamentMutationLock(reference.tournamentId, getTournamentMutationActor(access), async (tx) => {
      const [match] = await tx.select().from(matchesTable).where(eq(matchesTable.id, params.data.id)).for("update");
      if (!match) throw new LeagueRouteError(404, "MATCH_NOT_FOUND", "Mecz nie istnieje.");
      if (match.status === "completed" || match.status === "cancelled") {
        throw new LeagueRouteError(422, "MATCH_SCHEDULE_LOCKED", "Rozegranego lub anulowanego meczu nie przenosi się na inny termin.");
      }
      const [stage] = await tx.select().from(tournamentStagesTable).where(eq(tournamentStagesTable.id, match.stageId)).for("update");
      if (!stage) throw new LeagueRouteError(404, "STAGE_NOT_FOUND", "Etap nie istnieje.");
      let timeZone = stage.scheduleTimeZone;
      if (!timeZone) {
        const requested = body.data.timeZone ?? DEFAULT_SCHEDULE_TIME_ZONE;
        if (!isValidTimeZone(requested)) throw new LeagueRouteError(422, "INVALID_TIME_ZONE", "Nieznana strefa czasowa.");
        timeZone = requested;
      } else if (body.data.timeZone && body.data.timeZone !== timeZone) {
        throw new LeagueRouteError(422, "TIME_ZONE_MISMATCH", `Terminarz tego etapu jest w strefie ${timeZone}. Podaj godzinę w tej strefie.`);
      }
      let scheduledAt: Date | null = null;
      if (body.data.date != null) {
        if (!body.data.time) throw new LeagueRouteError(422, "INVALID_LOCAL_TIME", "Podaj godzinę meczu (GG:MM).");
        const converted = localDateTimeToInstant(body.data.date, body.data.time, timeZone);
        if (!converted.ok) throw new LeagueRouteError(422, converted.code, converted.message);
        scheduledAt = converted.instant;
      }
      // V5.7 · compare-and-set on the date itself: a date change never conflicts with a result or a start,
      // but a date set by someone else meanwhile is not silently replaced.
      const currentMs = match.scheduledAt?.getTime() ?? null;
      if ((scheduledAt?.getTime() ?? null) === currentMs) return match; // already this date (safe retry)
      const expectedMs = body.data.expectedScheduledAt == null ? null : new Date(body.data.expectedScheduledAt).getTime();
      if (expectedMs !== currentMs) {
        const now = match.scheduledAt ? instantToLocal(match.scheduledAt, timeZone) : null;
        throw new LeagueRouteError(409, "SCHEDULE_CHANGED", `Termin tego meczu zmienił się w międzyczasie — teraz: ${now ? `${now.date} ${now.time}` : "bez terminu"}. Nic nie zapisano; sprawdź termin i zdecyduj ponownie.`);
      }
      const [updated] = await tx.update(matchesTable).set({ scheduledAt }).where(eq(matchesTable.id, match.id)).returning();
      if (!stage.scheduleTimeZone) {
        await tx.update(tournamentStagesTable).set({ scheduleTimeZone: timeZone }).where(eq(tournamentStagesTable.id, stage.id));
      }
      const before = match.scheduledAt ? instantToLocal(match.scheduledAt, timeZone) : null;
      const after = scheduledAt ? instantToLocal(scheduledAt, timeZone) : null;
      await tx.insert(actionLogTable).values({
        tournamentId: match.tournamentId,
        stageId: match.stageId,
        matchId: match.id,
        actionType: "match_rescheduled",
        description: `Termin meczu R${match.round}M${match.matchNumber}: ${before ? `${before.date} ${before.time}` : "bez terminu"} → ${after ? `${after.date} ${after.time}` : "bez terminu"} (${timeZone})`,
        undoPayload: null,
        isUndone: false,
      });
      return updated!;
    });
    const [enriched] = await enrichMatches([saved], "organizer");
    res.json(enriched);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
