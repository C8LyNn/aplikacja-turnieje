import { Router, type IRouter } from "express";
import { eq, and, sql, inArray } from "drizzle-orm";
import { db, tournamentsTable, playersTable, matchesTable } from "@workspace/db";
import {
  CreateTournamentBody,
  UpdateTournamentBody,
  GetTournamentParams,
  UpdateTournamentParams,
  DeleteTournamentParams,
  StartTournamentParams,
  GetTournamentBracketParams,
  GetTournamentStatsParams,
  ListPlayersParams,
  AddPlayerBody,
  AddPlayerParams,
  UpdatePlayerParams,
  UpdatePlayerBody,
  DeletePlayerParams,
  ListMatchesParams,
  GetMatchParams,
  UpdateMatchParams,
  UpdateMatchBody,
  CompleteMatchParams,
  CompleteMatchBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number {
  const val = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(val as string, 10);
}

function formatDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString();
}

function mapTournament(t: typeof tournamentsTable.$inferSelect) {
  return {
    ...t,
    createdAt: formatDate(t.createdAt) ?? new Date().toISOString(),
    maxPlayers: t.maxPlayers ?? null,
    currentRound: t.currentRound ?? null,
    totalRounds: t.totalRounds ?? null,
    winnerId: t.winnerId ?? null,
  };
}

function mapPlayer(p: typeof playersTable.$inferSelect) {
  return {
    ...p,
    seed: p.seed ?? null,
    createdAt: formatDate(p.createdAt) ?? new Date().toISOString(),
  };
}

function mapMatch(m: typeof matchesTable.$inferSelect, player1Name?: string | null, player2Name?: string | null) {
  return {
    ...m,
    player1Id: m.player1Id ?? null,
    player2Id: m.player2Id ?? null,
    player1Name: player1Name ?? null,
    player2Name: player2Name ?? null,
    score1: m.score1 ?? null,
    score2: m.score2 ?? null,
    winnerId: m.winnerId ?? null,
    nextMatchId: m.nextMatchId ?? null,
    scheduledAt: formatDate(m.scheduledAt),
  };
}

async function enrichMatches(matches: (typeof matchesTable.$inferSelect)[]) {
  if (matches.length === 0) return [];
  const playerIds = [...new Set([
    ...matches.map(m => m.player1Id).filter(Boolean),
    ...matches.map(m => m.player2Id).filter(Boolean),
  ])] as number[];

  const players = playerIds.length > 0
    ? await db.select().from(playersTable).where(inArray(playersTable.id, playerIds))
    : [];
  const playerMap = new Map(players.map(p => [p.id, p.name]));

  return matches.map(m => mapMatch(m, playerMap.get(m.player1Id!) ?? null, playerMap.get(m.player2Id!) ?? null));
}

// Bracket generation for single elimination
function generateSingleElimination(players: (typeof playersTable.$inferSelect)[], tournamentId: number) {
  const seeded = [...players].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
  const n = seeded.length;
  // Round up to next power of 2
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(n, 2))));
  const totalRounds = Math.ceil(Math.log2(bracketSize));

  const matches: (typeof matchesTable.$inferInsert)[] = [];

  // First round - pair up players, byes for empty slots
  const firstRoundMatchCount = bracketSize / 2;
  for (let i = 0; i < firstRoundMatchCount; i++) {
    const p1 = seeded[i * 2] ?? null;
    const p2 = seeded[i * 2 + 1] ?? null;
    const isBye = p1 && !p2;
    matches.push({
      tournamentId,
      round: 1,
      matchNumber: i + 1,
      player1Id: p1?.id ?? null,
      player2Id: p2?.id ?? null,
      status: isBye ? "bye" : "pending",
      winnerId: isBye ? p1!.id : null,
    });
  }

  // Subsequent rounds (empty slots, filled as winners advance)
  for (let r = 2; r <= totalRounds; r++) {
    const count = Math.pow(2, totalRounds - r);
    for (let i = 0; i < count; i++) {
      matches.push({
        tournamentId,
        round: r,
        matchNumber: i + 1,
        status: "pending",
      });
    }
  }

  return { matches, totalRounds };
}

// Round robin generation
function generateRoundRobin(players: (typeof playersTable.$inferSelect)[], tournamentId: number) {
  const n = players.length;
  const matches: (typeof matchesTable.$inferInsert)[] = [];
  let matchNum = 1;

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      matches.push({
        tournamentId,
        round: 1,
        matchNumber: matchNum++,
        player1Id: players[i].id,
        player2Id: players[j].id,
        status: "pending",
      });
    }
  }

  return { matches, totalRounds: 1 };
}

// ==================
// TOURNAMENT ROUTES
// ==================

router.get("/tournaments", async (_req, res): Promise<void> => {
  const tournaments = await db.select().from(tournamentsTable).orderBy(tournamentsTable.createdAt);
  res.json(tournaments.map(mapTournament));
});

router.post("/tournaments", async (req, res): Promise<void> => {
  const parsed = CreateTournamentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [t] = await db.insert(tournamentsTable).values(parsed.data).returning();
  res.status(201).json(mapTournament(t));
});

router.get("/tournaments/:id", async (req, res): Promise<void> => {
  const params = GetTournamentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [t] = await db.select().from(tournamentsTable).where(eq(tournamentsTable.id, params.data.id));
  if (!t) { res.status(404).json({ error: "Tournament not found" }); return; }
  res.json(mapTournament(t));
});

router.patch("/tournaments/:id", async (req, res): Promise<void> => {
  const params = UpdateTournamentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateTournamentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [t] = await db.update(tournamentsTable).set(parsed.data).where(eq(tournamentsTable.id, params.data.id)).returning();
  if (!t) { res.status(404).json({ error: "Tournament not found" }); return; }
  res.json(mapTournament(t));
});

router.delete("/tournaments/:id", async (req, res): Promise<void> => {
  const params = DeleteTournamentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(tournamentsTable).where(eq(tournamentsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/tournaments/:id/start", async (req, res): Promise<void> => {
  const params = StartTournamentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [tournament] = await db.select().from(tournamentsTable).where(eq(tournamentsTable.id, params.data.id));
  if (!tournament) { res.status(404).json({ error: "Tournament not found" }); return; }
  if (tournament.status !== "draft") { res.status(400).json({ error: "Tournament already started" }); return; }

  const players = await db.select().from(playersTable).where(eq(playersTable.tournamentId, params.data.id));
  if (players.length < 2) { res.status(400).json({ error: "Need at least 2 players to start" }); return; }

  // Delete existing matches
  await db.delete(matchesTable).where(eq(matchesTable.tournamentId, params.data.id));

  let generatedMatches: (typeof matchesTable.$inferInsert)[];
  let totalRounds: number;

  if (tournament.format === "round_robin") {
    const result = generateRoundRobin(players, params.data.id);
    generatedMatches = result.matches;
    totalRounds = result.totalRounds;
  } else {
    const result = generateSingleElimination(players, params.data.id);
    generatedMatches = result.matches;
    totalRounds = result.totalRounds;
  }

  await db.insert(matchesTable).values(generatedMatches);

  // Handle byes - advance bye winners to next round
  if (tournament.format !== "round_robin") {
    const allMatches = await db.select().from(matchesTable)
      .where(and(eq(matchesTable.tournamentId, params.data.id), eq(matchesTable.round, 1)));
    const byeMatches = allMatches.filter(m => m.status === "bye" && m.winnerId);
    if (byeMatches.length > 0) {
      for (const byeMatch of byeMatches) {
        // Advance bye winner to round 2
        const round2Matches = await db.select().from(matchesTable)
          .where(and(eq(matchesTable.tournamentId, params.data.id), eq(matchesTable.round, 2)));
        const targetMatchIndex = Math.floor((byeMatch.matchNumber - 1) / 2);
        const targetMatch = round2Matches[targetMatchIndex];
        if (targetMatch) {
          const isPlayer1Slot = (byeMatch.matchNumber - 1) % 2 === 0;
          await db.update(matchesTable).set(
            isPlayer1Slot ? { player1Id: byeMatch.winnerId } : { player2Id: byeMatch.winnerId }
          ).where(eq(matchesTable.id, targetMatch.id));
        }
      }
    }
  }

  const [updated] = await db.update(tournamentsTable).set({
    status: "active",
    currentRound: 1,
    totalRounds,
  }).where(eq(tournamentsTable.id, params.data.id)).returning();

  res.json(mapTournament(updated));
});

router.get("/tournaments/:id/bracket", async (req, res): Promise<void> => {
  const params = GetTournamentBracketParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [tournament] = await db.select().from(tournamentsTable).where(eq(tournamentsTable.id, params.data.id));
  if (!tournament) { res.status(404).json({ error: "Tournament not found" }); return; }

  const matches = await db.select().from(matchesTable)
    .where(eq(matchesTable.tournamentId, params.data.id))
    .orderBy(matchesTable.round, matchesTable.matchNumber);

  const enriched = await enrichMatches(matches);

  const roundNumbers = [...new Set(enriched.map(m => m.round))].sort((a, b) => a - b);
  const rounds = roundNumbers.map(round => ({
    round,
    matches: enriched.filter(m => m.round === round),
  }));

  let winner = null;
  if (tournament.winnerId) {
    const [winnerPlayer] = await db.select().from(playersTable).where(eq(playersTable.id, tournament.winnerId));
    if (winnerPlayer) winner = { id: winnerPlayer.id, name: winnerPlayer.name };
  }

  res.json({ tournament: mapTournament(tournament), rounds, winner });
});

router.get("/tournaments/:id/stats", async (req, res): Promise<void> => {
  const params = GetTournamentStatsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [tournament] = await db.select().from(tournamentsTable).where(eq(tournamentsTable.id, params.data.id));
  if (!tournament) { res.status(404).json({ error: "Tournament not found" }); return; }

  const players = await db.select().from(playersTable).where(eq(playersTable.tournamentId, params.data.id));
  const matches = await db.select().from(matchesTable).where(eq(matchesTable.tournamentId, params.data.id));

  const completedMatches = matches.filter(m => m.status === "completed").length;
  const pendingMatches = matches.filter(m => m.status === "pending").length;
  const inProgressMatches = matches.filter(m => m.status === "in_progress").length;

  const topPlayers = [...players]
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
    .slice(0, 5)
    .map(p => ({ id: p.id, name: p.name, wins: p.wins, losses: p.losses }));

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

// ==================
// PLAYER ROUTES
// ==================

router.get("/tournaments/:id/players", async (req, res): Promise<void> => {
  const params = ListPlayersParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const players = await db.select().from(playersTable)
    .where(eq(playersTable.tournamentId, params.data.id))
    .orderBy(playersTable.seed, playersTable.createdAt);
  res.json(players.map(mapPlayer));
});

router.post("/tournaments/:id/players", async (req, res): Promise<void> => {
  const params = AddPlayerParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = AddPlayerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [player] = await db.insert(playersTable).values({
    tournamentId: params.data.id,
    ...parsed.data,
  }).returning();
  res.status(201).json(mapPlayer(player));
});

router.patch("/players/:id", async (req, res): Promise<void> => {
  const params = UpdatePlayerParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdatePlayerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [player] = await db.update(playersTable).set(parsed.data).where(eq(playersTable.id, params.data.id)).returning();
  if (!player) { res.status(404).json({ error: "Player not found" }); return; }
  res.json(mapPlayer(player));
});

router.delete("/players/:id", async (req, res): Promise<void> => {
  const params = DeletePlayerParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(playersTable).where(eq(playersTable.id, params.data.id));
  res.sendStatus(204);
});

// ==================
// MATCH ROUTES
// ==================

router.get("/tournaments/:id/matches", async (req, res): Promise<void> => {
  const params = ListMatchesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const matches = await db.select().from(matchesTable)
    .where(eq(matchesTable.tournamentId, params.data.id))
    .orderBy(matchesTable.round, matchesTable.matchNumber);
  const enriched = await enrichMatches(matches);
  res.json(enriched);
});

router.get("/matches/:id", async (req, res): Promise<void> => {
  const params = GetMatchParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.id));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  const [enriched] = await enrichMatches([match]);
  res.json(enriched);
});

router.patch("/matches/:id", async (req, res): Promise<void> => {
  const params = UpdateMatchParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateMatchBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [match] = await db.update(matchesTable).set(parsed.data).where(eq(matchesTable.id, params.data.id)).returning();
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  const [enriched] = await enrichMatches([match]);
  res.json(enriched);
});

router.post("/matches/:id/complete", async (req, res): Promise<void> => {
  const params = CompleteMatchParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = CompleteMatchBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { winnerId, score1, score2 } = parsed.data;

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.id));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }

  // Update match
  const [updatedMatch] = await db.update(matchesTable).set({
    winnerId,
    score1,
    score2,
    status: "completed",
  }).where(eq(matchesTable.id, params.data.id)).returning();

  // Update player wins/losses
  const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;
  if (winnerId) {
    await db.update(playersTable).set({ wins: sql`${playersTable.wins} + 1` }).where(eq(playersTable.id, winnerId));
  }
  if (loserId) {
    await db.update(playersTable).set({ losses: sql`${playersTable.losses} + 1` }).where(eq(playersTable.id, loserId));
    if (loserId) {
      const [tournament] = await db.select().from(tournamentsTable).where(eq(tournamentsTable.id, match.tournamentId));
      if (tournament?.format === "single_elimination") {
        await db.update(playersTable).set({ status: "eliminated" }).where(eq(playersTable.id, loserId));
      }
    }
  }

  // Advance winner to next round (single elimination)
  const [tournament] = await db.select().from(tournamentsTable).where(eq(tournamentsTable.id, match.tournamentId));
  if (tournament?.format !== "round_robin") {
    // Find next match in next round
    const nextRound = match.round + 1;
    const nextRoundMatches = await db.select().from(matchesTable)
      .where(and(
        eq(matchesTable.tournamentId, match.tournamentId),
        eq(matchesTable.round, nextRound)
      ))
      .orderBy(matchesTable.matchNumber);

    const nextMatchIndex = Math.floor((match.matchNumber - 1) / 2);
    const nextMatch = nextRoundMatches[nextMatchIndex];

    if (nextMatch) {
      const isPlayer1Slot = (match.matchNumber - 1) % 2 === 0;
      await db.update(matchesTable).set(
        isPlayer1Slot ? { player1Id: winnerId } : { player2Id: winnerId }
      ).where(eq(matchesTable.id, nextMatch.id));
    } else {
      // No next match — tournament might be over
      const remainingMatches = await db.select().from(matchesTable)
        .where(and(
          eq(matchesTable.tournamentId, match.tournamentId),
          sql`status != 'completed' AND status != 'bye'`
        ));

      if (remainingMatches.length === 0) {
        // Tournament complete
        await db.update(tournamentsTable).set({ status: "completed", winnerId }).where(eq(tournamentsTable.id, match.tournamentId));
        if (winnerId) {
          await db.update(playersTable).set({ status: "winner" }).where(eq(playersTable.id, winnerId));
        }
      }
    }

    // Update current round
    const currentRoundMatches = await db.select().from(matchesTable)
      .where(and(
        eq(matchesTable.tournamentId, match.tournamentId),
        eq(matchesTable.round, match.round)
      ));
    const allCurrentRoundDone = currentRoundMatches.every(m => m.status === "completed" || m.status === "bye");
    if (allCurrentRoundDone && nextRoundMatches.length > 0) {
      await db.update(tournamentsTable).set({ currentRound: nextRound }).where(eq(tournamentsTable.id, match.tournamentId));
    }
  } else {
    // Round robin: check if all matches done
    const allMatches = await db.select().from(matchesTable).where(eq(matchesTable.tournamentId, match.tournamentId));
    const allDone = allMatches.every(m => m.status === "completed");
    if (allDone) {
      // Find player with most wins
      const players = await db.select().from(playersTable).where(eq(playersTable.tournamentId, match.tournamentId));
      const topPlayer = players.reduce((a, b) => a.wins > b.wins ? a : b, players[0]);
      if (topPlayer) {
        await db.update(tournamentsTable).set({ status: "completed", winnerId: topPlayer.id }).where(eq(tournamentsTable.id, match.tournamentId));
        await db.update(playersTable).set({ status: "winner" }).where(eq(playersTable.id, topPlayer.id));
      }
    }
  }

  const [enriched] = await enrichMatches([updatedMatch]);
  res.json(enriched);
});

export default router;
