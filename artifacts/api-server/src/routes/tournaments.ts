import { Router, type IRouter } from "express";
import { eq, and, sql, inArray, desc } from "drizzle-orm";
import { db, tournamentsTable, playersTable, matchesTable, resultHistoryTable, actionLogTable } from "@workspace/db";
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
  GetActionLogParams,
  UndoLastActionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ========== HELPERS ==========

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
    swissRounds: t.swissRounds ?? null,
    allowDraws: t.allowDraws ?? null,
    defaultBestOf: t.defaultBestOf ?? null,
    currentRound: t.currentRound ?? null,
    totalRounds: t.totalRounds ?? null,
    winnerId: t.winnerId ?? null,
    featuredMatchId: t.featuredMatchId ?? null,
  };
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
    isDraw: m.isDraw ?? null,
    bestOf: m.bestOf ?? null,
    note: m.note ?? null,
    nextMatchId: m.nextMatchId ?? null,
    scheduledAt: formatDate(m.scheduledAt),
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

  const firstRoundCount = bracketSize / 2;
  for (let i = 0; i < firstRoundCount; i++) {
    const p1 = seeded[i * 2] ?? null;
    const p2 = seeded[i * 2 + 1] ?? null;
    const isBye = p1 && !p2;
    matches.push({
      tournamentId,
      round: 1,
      matchNumber: i + 1,
      player1Id: p1?.id ?? null,
      player2Id: p2?.id ?? null,
      bestOf: defaultBestOf,
      status: isBye ? "bye" : "pending",
      winnerId: isBye ? p1!.id : null,
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
        bestOf: defaultBestOf,
        status: "pending",
      });
    }
  }
  return { matches, totalRounds: 1 };
}

function generateSwissRound(
  players: (typeof playersTable.$inferSelect)[],
  completedMatches: (typeof matchesTable.$inferSelect)[],
  tournamentId: number,
  roundIndex: number,
  defaultBestOf: number,
): (typeof matchesTable.$inferInsert)[] {
  // Build played-against map
  const played = new Map<number, Set<number>>();
  for (const p of players) played.set(p.id, new Set());
  for (const m of completedMatches) {
    if (m.player1Id && m.player2Id) {
      played.get(m.player1Id)?.add(m.player2Id);
      played.get(m.player2Id)?.add(m.player1Id);
    }
  }

  // Sort by points desc, then wins desc
  const sorted = [...players].sort(
    (a, b) => b.points - a.points || b.wins - a.wins,
  );

  const newMatches: (typeof matchesTable.$inferInsert)[] = [];
  const paired = new Set<number>();
  let matchNum = 1;

  // Greedy pairing
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    if (paired.has(a.id)) continue;
    // Find best unpaired opponent not yet played
    let partner: (typeof playersTable.$inferSelect) | null = null;
    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      if (paired.has(b.id)) continue;
      if (!played.get(a.id)?.has(b.id)) {
        partner = b;
        break;
      }
    }
    // Fallback: allow repeat pairing
    if (!partner) {
      for (let j = i + 1; j < sorted.length; j++) {
        const b = sorted[j];
        if (!paired.has(b.id)) {
          partner = b;
          break;
        }
      }
    }
    if (!partner) {
      // Bye
      newMatches.push({
        tournamentId,
        round: roundIndex,
        matchNumber: matchNum++,
        player1Id: a.id,
        player2Id: null,
        bestOf: defaultBestOf,
        status: "bye",
        winnerId: a.id,
        score1: 1,
        score2: 0,
      });
      paired.add(a.id);
      continue;
    }
    paired.add(a.id);
    paired.add(partner.id);
    newMatches.push({
      tournamentId,
      round: roundIndex,
      matchNumber: matchNum++,
      player1Id: a.id,
      player2Id: partner.id,
      bestOf: defaultBestOf,
      status: "pending",
    });
  }

  return newMatches;
}

// ========== STANDINGS ==========

function calculateStandings(
  players: (typeof playersTable.$inferSelect)[],
  matches: (typeof matchesTable.$inferSelect)[],
  tournament: typeof tournamentsTable.$inferSelect,
) {
  const pointsForWin = 3;
  const pointsForDraw = 1;
  const pointsForLoss = 0;

  const completedMatches = matches.filter((m) => m.status === "completed" || m.status === "bye");

  // Build points map from scratch
  const pts = new Map<number, number>();
  const gf = new Map<number, number>();
  const ga = new Map<number, number>();
  const opponents = new Map<number, number[]>();

  for (const p of players) {
    pts.set(p.id, 0);
    gf.set(p.id, 0);
    ga.set(p.id, 0);
    opponents.set(p.id, []);
  }

  for (const m of completedMatches) {
    if (!m.player1Id) continue;
    const p1 = m.player1Id;
    const p2 = m.player2Id;

    if (m.status === "bye") {
      pts.set(p1, (pts.get(p1) ?? 0) + pointsForWin);
      continue;
    }

    if (!p2) continue;
    opponents.get(p1)?.push(p2);
    opponents.get(p2)?.push(p1);

    gf.set(p1, (gf.get(p1) ?? 0) + (m.score1 ?? 0));
    ga.set(p1, (ga.get(p1) ?? 0) + (m.score2 ?? 0));
    gf.set(p2, (gf.get(p2) ?? 0) + (m.score2 ?? 0));
    ga.set(p2, (ga.get(p2) ?? 0) + (m.score1 ?? 0));

    if (m.isDraw) {
      pts.set(p1, (pts.get(p1) ?? 0) + pointsForDraw);
      pts.set(p2, (pts.get(p2) ?? 0) + pointsForDraw);
    } else if (m.winnerId === p1) {
      pts.set(p1, (pts.get(p1) ?? 0) + pointsForWin);
      pts.set(p2, (pts.get(p2) ?? 0) + pointsForLoss);
    } else if (m.winnerId === p2) {
      pts.set(p2, (pts.get(p2) ?? 0) + pointsForWin);
      pts.set(p1, (pts.get(p1) ?? 0) + pointsForLoss);
    }
  }

  // Buchholz = sum of opponent points
  const buchholz = new Map<number, number>();
  for (const p of players) {
    const opps = opponents.get(p.id) ?? [];
    const buch = opps.reduce((sum, oppId) => sum + (pts.get(oppId) ?? 0), 0);
    buchholz.set(p.id, buch);
  }

  const standings = players.map((p) => ({
    playerId: p.id,
    playerName: p.name,
    rank_name: p.rank ?? null,
    teamName: p.teamName ?? null,
    country: p.country ?? null,
    seed: p.seed ?? null,
    points: pts.get(p.id) ?? 0,
    wins: p.wins,
    draws: p.draws,
    losses: p.losses,
    buchholz: buchholz.get(p.id) ?? 0,
    gamesFor: gf.get(p.id) ?? 0,
    gamesAgainst: ga.get(p.id) ?? 0,
    pointDiff: (gf.get(p.id) ?? 0) - (ga.get(p.id) ?? 0),
    rank: 0,
  }));

  standings.sort(
    (a, b) =>
      b.points - a.points ||
      b.buchholz - a.buchholz ||
      b.pointDiff - a.pointDiff ||
      (a.seed ?? 999) - (b.seed ?? 999),
  );

  standings.forEach((s, i) => {
    s.rank = i + 1;
  });

  return standings;
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
    .orderBy(tournamentsTable.createdAt);
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
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [t] = await db
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, params.data.id));
  if (!t) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }
  res.json(mapTournament(t));
});

router.patch("/tournaments/:id", async (req, res): Promise<void> => {
  const params = UpdateTournamentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateTournamentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
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
  if (tournament.status !== "draft") {
    res.status(400).json({ error: "Tournament already started" });
    return;
  }

  const players = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.tournamentId, params.data.id));
  if (players.length < 2) {
    res.status(400).json({ error: "Need at least 2 players to start" });
    return;
  }

  await db.delete(matchesTable).where(eq(matchesTable.tournamentId, params.data.id));

  const bestOf = tournament.defaultBestOf ?? 1;
  let generatedMatches: (typeof matchesTable.$inferInsert)[];
  let totalRounds: number;

  if (tournament.format === "round_robin") {
    const r = generateRoundRobin(players, params.data.id, bestOf);
    generatedMatches = r.matches;
    totalRounds = r.totalRounds;
  } else if (tournament.format === "swiss") {
    const swissRounds = tournament.swissRounds ?? Math.ceil(Math.log2(players.length));
    generatedMatches = generateSwissRound(players, [], params.data.id, 1, bestOf);
    totalRounds = swissRounds;
  } else {
    // single_elimination / double_elimination
    const r = generateSingleElimination(players, params.data.id, bestOf);
    generatedMatches = r.matches;
    totalRounds = r.totalRounds;
  }

  const inserted = await db
    .insert(matchesTable)
    .values(generatedMatches)
    .returning();

  // For single elimination: advance bye winners to round 2
  if (tournament.format !== "round_robin" && tournament.format !== "swiss") {
    const byeMatches = inserted.filter((m) => m.status === "bye" && m.winnerId);
    for (const byeMatch of byeMatches) {
      const round2Matches = inserted.filter((m) => m.round === 2);
      round2Matches.sort((a, b) => a.matchNumber - b.matchNumber);
      const targetMatchIndex = Math.floor((byeMatch.matchNumber - 1) / 2);
      const targetMatch = round2Matches[targetMatchIndex];
      if (targetMatch) {
        const isP1 = (byeMatch.matchNumber - 1) % 2 === 0;
        await db
          .update(matchesTable)
          .set(isP1 ? { player1Id: byeMatch.winnerId } : { player2Id: byeMatch.winnerId })
          .where(eq(matchesTable.id, targetMatch.id));
      }
    }
    // Update bye matches stats
    for (const byeMatch of byeMatches) {
      if (byeMatch.winnerId) {
        await db
          .update(playersTable)
          .set({ wins: sql`${playersTable.wins} + 1`, points: sql`${playersTable.points} + 3` })
          .where(eq(playersTable.id, byeMatch.winnerId));
      }
    }
  }

  // For swiss: advance bye winners stats too
  if (tournament.format === "swiss") {
    const byeMatches = inserted.filter((m) => m.status === "bye" && m.winnerId);
    for (const byeMatch of byeMatches) {
      if (byeMatch.winnerId) {
        await db
          .update(playersTable)
          .set({ wins: sql`${playersTable.wins} + 1`, points: sql`${playersTable.points} + 3` })
          .where(eq(playersTable.id, byeMatch.winnerId));
      }
    }
  }

  const swissRounds = tournament.format === "swiss" ? (tournament.swissRounds ?? Math.ceil(Math.log2(players.length))) : undefined;
  const [updated] = await db
    .update(tournamentsTable)
    .set({
      status: "active",
      currentRound: 1,
      totalRounds,
      ...(tournament.format === "swiss" ? { swissRounds } : {}),
    })
    .where(eq(tournamentsTable.id, params.data.id))
    .returning();

  await logAction({ tournamentId: params.data.id, actionType: "tournament_started", description: `Turniej wystartował: ${players.length} graczy, ${totalRounds} rund (${tournament.format})` });

  res.json(mapTournament(updated));
});

router.post("/tournaments/:id/generate-round", async (req, res): Promise<void> => {
  const params = GenerateNextRoundParams.safeParse(req.params);
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
  if (tournament.format !== "swiss") {
    res.status(400).json({ error: "Only Swiss format supports round generation" });
    return;
  }
  if (tournament.status !== "active") {
    res.status(400).json({ error: "Tournament not active" });
    return;
  }

  const currentRound = tournament.currentRound ?? 1;
  const maxRounds = tournament.swissRounds ?? 99;

  // Check all current round matches are done
  const currentMatches = await db
    .select()
    .from(matchesTable)
    .where(
      and(
        eq(matchesTable.tournamentId, params.data.id),
        eq(matchesTable.round, currentRound),
      ),
    );
  const allDone = currentMatches.every(
    (m) => m.status === "completed" || m.status === "bye" || m.status === "walkover" || m.status === "postponed",
  );
  if (!allDone) {
    res.status(400).json({ error: "Not all matches in current round are finished" });
    return;
  }

  if (currentRound >= maxRounds) {
    res.status(400).json({ error: "All Swiss rounds already generated" });
    return;
  }

  const nextRound = currentRound + 1;
  const players = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.tournamentId, params.data.id));
  const allMatches = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.tournamentId, params.data.id));

  const bestOf = tournament.defaultBestOf ?? 1;
  const newMatches = generateSwissRound(players, allMatches, params.data.id, nextRound, bestOf);
  await db.insert(matchesTable).values(newMatches);

  const [updated] = await db
    .update(tournamentsTable)
    .set({ currentRound: nextRound })
    .where(eq(tournamentsTable.id, params.data.id))
    .returning();

  res.json(mapTournament(updated));
});

router.get("/tournaments/:id/bracket", async (req, res): Promise<void> => {
  const params = GetTournamentBracketParams.safeParse(req.params);
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

  const players = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.tournamentId, params.data.id));
  const matches = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.tournamentId, params.data.id));

  const completedMatches = matches.filter((m) => m.status === "completed").length;
  const pendingMatches = matches.filter((m) => m.status === "pending" || m.status === "ready").length;
  const inProgressMatches = matches.filter((m) => m.status === "in_progress").length;

  const topPlayers = [...players]
    .sort((a, b) => b.points - a.points || b.wins - a.wins || a.losses - b.losses)
    .slice(0, 5)
    .map((p) => ({ id: p.id, name: p.name, wins: p.wins, losses: p.losses, points: p.points }));

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
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

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
      isDraw: h.isDraw ?? null,
      status: h.status,
      completedAt: formatDate(h.completedAt) ?? new Date().toISOString(),
    })),
  );
});

router.get("/tournaments/:id/assistant", async (req, res): Promise<void> => {
  const params = GetTournamentAssistantParams.safeParse(req.params);
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
    const pending = matches.filter((m) => m.status === "pending" || m.status === "ready");
    const live = matches.filter((m) => m.status === "in_progress");
    const done = matches.filter((m) => m.status === "completed" || m.status === "bye" || m.status === "walkover");

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
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
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
  const [player] = await db
    .insert(playersTable)
    .values({ tournamentId: params.data.id, ...parsed.data })
    .returning();
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
  if (tournament.status !== "draft") {
    res.status(400).json({ error: "Cannot import players after tournament has started" });
    return;
  }

  const rows = parseCsv(parsed.data.csv);
  if (rows.length === 0) {
    res.status(400).json({ error: "No valid rows found in CSV" });
    return;
  }

  const inserted = await db
    .insert(playersTable)
    .values(
      rows.map((r) => ({
        tournamentId: params.data.id,
        name: r.name,
        rank: r.rank ?? null,
        seed: r.seed ?? null,
        teamName: r.teamName ?? null,
        country: r.country ?? null,
      })),
    )
    .returning();

  res.json({
    imported: inserted.length,
    skipped: rows.length - inserted.length,
    players: inserted.map(mapPlayer),
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

// ========== ACTION LOG ROUTES ==========

router.get("/tournaments/:id/action-log", async (req, res): Promise<void> => {
  const params = GetActionLogParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
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
    .orderBy(desc(actionLogTable.createdAt))
    .limit(1);

  if (!lastAction || !lastAction.undoPayload) {
    res.status(404).json({ error: "Brak akcji do cofnięcia" });
    return;
  }

  const payload = JSON.parse(lastAction.undoPayload) as Record<string, unknown>;

  try {
    switch (payload.type) {
      case "revert_match": {
        const matchId = payload.matchId as number;
        const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
        if (!match || match.status !== "completed") {
          res.status(400).json({ error: "Mecz nie może zostać cofnięty (nie jest zakończony)" });
          return;
        }
        // Revert player stats
        if (match.isDraw) {
          if (match.player1Id) await db.update(playersTable).set({ draws: sql`GREATEST(${playersTable.draws} - 1, 0)`, points: sql`GREATEST(${playersTable.points} - 1, 0)` }).where(eq(playersTable.id, match.player1Id));
          if (match.player2Id) await db.update(playersTable).set({ draws: sql`GREATEST(${playersTable.draws} - 1, 0)`, points: sql`GREATEST(${playersTable.points} - 1, 0)` }).where(eq(playersTable.id, match.player2Id));
        } else if (match.winnerId) {
          const loserId = match.player1Id === match.winnerId ? match.player2Id : match.player1Id;
          await db.update(playersTable).set({ wins: sql`GREATEST(${playersTable.wins} - 1, 0)`, points: sql`GREATEST(${playersTable.points} - 3, 0)` }).where(eq(playersTable.id, match.winnerId));
          if (loserId) await db.update(playersTable).set({ losses: sql`GREATEST(${playersTable.losses} - 1, 0)`, status: "active" }).where(eq(playersTable.id, loserId));
        }
        // Revert bracket advancement
        const [tournament] = await db.select().from(tournamentsTable).where(eq(tournamentsTable.id, match.tournamentId));
        if (tournament?.format !== "round_robin" && tournament?.format !== "swiss" && match.winnerId) {
          const nextRoundMatches = await db.select().from(matchesTable).where(and(eq(matchesTable.tournamentId, match.tournamentId), eq(matchesTable.round, match.round + 1))).orderBy(matchesTable.matchNumber);
          const nextMatchIndex = Math.floor((match.matchNumber - 1) / 2);
          const nextMatch = nextRoundMatches[nextMatchIndex];
          if (nextMatch) {
            const isP1 = (match.matchNumber - 1) % 2 === 0;
            await db.update(matchesTable).set(isP1 ? { player1Id: null } : { player2Id: null }).where(eq(matchesTable.id, nextMatch.id));
          }
        }
        // Revert tournament completion if it was the last match
        if (tournament?.status === "completed" && tournament.winnerId) {
          await db.update(tournamentsTable).set({ status: "active", winnerId: null }).where(eq(tournamentsTable.id, match.tournamentId));
          await db.update(playersTable).set({ status: "active" }).where(and(eq(playersTable.tournamentId, match.tournamentId), eq(playersTable.status, "winner")));
        }
        // Reset match
        await db.update(matchesTable).set({ status: "pending", winnerId: null, score1: null, score2: null, isDraw: false, completedAt: null }).where(eq(matchesTable.id, matchId));
        // Remove from result history
        await db.delete(resultHistoryTable).where(eq(resultHistoryTable.matchId, matchId));
        // Log the revert
        await logAction({ tournamentId: params.data.id, actionType: "match_result_reverted", description: lastAction.description.replace("Wynik:", "Cofnięto wynik:"), matchId });
        break;
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
      default:
        res.status(400).json({ error: `Nie można cofnąć akcji: ${payload.type}` });
        return;
    }

    // Mark as undone
    await db.update(actionLogTable).set({ isUndone: true }).where(eq(actionLogTable.id, lastAction.id));

    const [updated] = await db.select().from(actionLogTable).where(eq(actionLogTable.id, lastAction.id));
    res.json({ action: mapActionLog(updated!), message: `Cofnięto: ${lastAction.description}` });
  } catch (err) {
    res.status(500).json({ error: "Błąd podczas cofania akcji" });
  }
});

// ========== MATCH ROUTES ==========

router.get("/tournaments/:id/matches", async (req, res): Promise<void> => {
  const params = ListMatchesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
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
  const [enriched] = await enrichMatches([match]);
  res.json(enriched);
});

router.patch("/matches/:id", async (req, res): Promise<void> => {
  const params = UpdateMatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateMatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  // Read previous state before update for logging
  const [prevMatch] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.id));
  const [match] = await db
    .update(matchesTable)
    .set(parsed.data)
    .where(eq(matchesTable.id, params.data.id))
    .returning();
  if (!match) {
    res.status(404).json({ error: "Match not found" });
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
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { score1, score2, isDraw, note } = parsed.data;
  let { winnerId } = parsed.data;

  const [match] = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.id, params.data.id));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const [tournament] = await db
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, match.tournamentId));

  const now = new Date();

  // Auto-determine winner from scores if not provided
  if (!isDraw && !winnerId) {
    if (score1 > score2) winnerId = match.player1Id ?? undefined;
    else if (score2 > score1) winnerId = match.player2Id ?? undefined;
  }

  const [updatedMatch] = await db
    .update(matchesTable)
    .set({
      winnerId: isDraw ? null : (winnerId ?? null),
      score1,
      score2,
      isDraw: isDraw ?? false,
      status: "completed",
      note: note ?? null,
      completedAt: now,
    })
    .where(eq(matchesTable.id, params.data.id))
    .returning();

  // Update player stats
  if (isDraw) {
    if (match.player1Id) {
      await db.update(playersTable).set({
        draws: sql`${playersTable.draws} + 1`,
        points: sql`${playersTable.points} + 1`,
      }).where(eq(playersTable.id, match.player1Id));
    }
    if (match.player2Id) {
      await db.update(playersTable).set({
        draws: sql`${playersTable.draws} + 1`,
        points: sql`${playersTable.points} + 1`,
      }).where(eq(playersTable.id, match.player2Id));
    }
  } else if (winnerId) {
    const loserId =
      match.player1Id === winnerId ? match.player2Id : match.player1Id;
    await db.update(playersTable).set({
      wins: sql`${playersTable.wins} + 1`,
      points: sql`${playersTable.points} + 3`,
    }).where(eq(playersTable.id, winnerId));
    if (loserId) {
      await db.update(playersTable).set({
        losses: sql`${playersTable.losses} + 1`,
      }).where(eq(playersTable.id, loserId));

      if (tournament?.format === "single_elimination") {
        await db.update(playersTable).set({ status: "eliminated" }).where(eq(playersTable.id, loserId));
      }
    }
  }

  // Save to result history
  await db.insert(resultHistoryTable).values({
    matchId: match.id,
    tournamentId: match.tournamentId,
    round: match.round,
    matchNumber: match.matchNumber,
    player1Id: match.player1Id ?? null,
    player2Id: match.player2Id ?? null,
    score1,
    score2,
    winnerId: isDraw ? null : (winnerId ?? null),
    isDraw: isDraw ?? false,
    status: "completed",
  });

  // Log action
  {
    const p1Ids = [match.player1Id, match.player2Id].filter(Boolean) as number[];
    const namePlayers = p1Ids.length > 0 ? await db.select().from(playersTable).where(inArray(playersTable.id, p1Ids)) : [];
    const nm = new Map(namePlayers.map((p) => [p.id, p.name]));
    const p1n = nm.get(match.player1Id ?? 0) ?? "TBD";
    const p2n = nm.get(match.player2Id ?? 0) ?? "TBD";
    const resultStr = isDraw ? `Remis ${score1}:${score2}` : `Wynik: ${p1n} ${score1}:${score2} ${p2n}`;
    const winnerName = !isDraw && winnerId ? (nm.get(winnerId) ?? "?") : null;
    const desc = winnerName ? `${resultStr} — wygrał ${winnerName}` : resultStr;
    await logAction({ tournamentId: match.tournamentId, actionType: "match_result_submitted", description: `R${match.round}M${match.matchNumber}: ${desc}`, matchId: match.id, undoPayload: { type: "revert_match", matchId: match.id } });
  }

  // Advance winner in single elimination bracket
  if (tournament?.format !== "round_robin" && tournament?.format !== "swiss") {
    const nextRound = match.round + 1;
    const nextRoundMatches = await db
      .select()
      .from(matchesTable)
      .where(
        and(
          eq(matchesTable.tournamentId, match.tournamentId),
          eq(matchesTable.round, nextRound),
        ),
      )
      .orderBy(matchesTable.matchNumber);

    const nextMatchIndex = Math.floor((match.matchNumber - 1) / 2);
    const nextMatch = nextRoundMatches[nextMatchIndex];

    if (nextMatch && winnerId) {
      const isP1 = (match.matchNumber - 1) % 2 === 0;
      await db
        .update(matchesTable)
        .set(isP1 ? { player1Id: winnerId } : { player2Id: winnerId })
        .where(eq(matchesTable.id, nextMatch.id));
    } else if (!nextMatch) {
      // Check if tournament is over
      const remaining = await db
        .select()
        .from(matchesTable)
        .where(
          and(
            eq(matchesTable.tournamentId, match.tournamentId),
            sql`status NOT IN ('completed', 'bye', 'walkover')`,
          ),
        );
      if (remaining.length === 0 && winnerId) {
        await db
          .update(tournamentsTable)
          .set({ status: "completed", winnerId })
          .where(eq(tournamentsTable.id, match.tournamentId));
        await db
          .update(playersTable)
          .set({ status: "winner" })
          .where(eq(playersTable.id, winnerId));
      }
    }

    // Update current round
    const currentRoundMatches = await db
      .select()
      .from(matchesTable)
      .where(
        and(
          eq(matchesTable.tournamentId, match.tournamentId),
          eq(matchesTable.round, match.round),
        ),
      );
    const allDone = currentRoundMatches.every(
      (m) => m.status === "completed" || m.status === "bye" || m.status === "walkover",
    );
    if (allDone && nextRoundMatches.length > 0) {
      await db
        .update(tournamentsTable)
        .set({ currentRound: nextRound })
        .where(eq(tournamentsTable.id, match.tournamentId));
    }
  } else if (tournament?.format === "round_robin") {
    // Check if all matches done
    const allMatches = await db
      .select()
      .from(matchesTable)
      .where(eq(matchesTable.tournamentId, match.tournamentId));
    const allDone = allMatches.every(
      (m) => m.status === "completed" || m.status === "bye" || m.status === "walkover",
    );
    if (allDone) {
      const players = await db
        .select()
        .from(playersTable)
        .where(eq(playersTable.tournamentId, match.tournamentId));
      const top = players.reduce((a, b) =>
        a.points > b.points ? a : b,
      );
      if (top) {
        await db
          .update(tournamentsTable)
          .set({ status: "completed", winnerId: top.id })
          .where(eq(tournamentsTable.id, match.tournamentId));
        await db
          .update(playersTable)
          .set({ status: "winner" })
          .where(eq(playersTable.id, top.id));
      }
    }
  }

  const [enriched] = await enrichMatches([updatedMatch]);
  res.json(enriched);
});

router.post("/matches/:id/revert", async (req, res): Promise<void> => {
  const params = RevertMatchParams.safeParse(req.params);
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
  if (match.status !== "completed") {
    res.status(400).json({ error: "Match is not completed" });
    return;
  }

  // Revert player stats
  if (match.isDraw) {
    if (match.player1Id) {
      await db.update(playersTable).set({
        draws: sql`GREATEST(${playersTable.draws} - 1, 0)`,
        points: sql`GREATEST(${playersTable.points} - 1, 0)`,
      }).where(eq(playersTable.id, match.player1Id));
    }
    if (match.player2Id) {
      await db.update(playersTable).set({
        draws: sql`GREATEST(${playersTable.draws} - 1, 0)`,
        points: sql`GREATEST(${playersTable.points} - 1, 0)`,
      }).where(eq(playersTable.id, match.player2Id));
    }
  } else if (match.winnerId) {
    const loserId =
      match.player1Id === match.winnerId ? match.player2Id : match.player1Id;
    await db.update(playersTable).set({
      wins: sql`GREATEST(${playersTable.wins} - 1, 0)`,
      points: sql`GREATEST(${playersTable.points} - 3, 0)`,
    }).where(eq(playersTable.id, match.winnerId));
    if (loserId) {
      await db.update(playersTable).set({
        losses: sql`GREATEST(${playersTable.losses} - 1, 0)`,
        status: "active",
      }).where(eq(playersTable.id, loserId));
    }
  }

  // Revert bracket advancement (single elimination only)
  const [tournament] = await db
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, match.tournamentId));

  if (
    tournament?.format !== "round_robin" &&
    tournament?.format !== "swiss" &&
    match.winnerId
  ) {
    const nextRound = match.round + 1;
    const nextRoundMatches = await db
      .select()
      .from(matchesTable)
      .where(
        and(
          eq(matchesTable.tournamentId, match.tournamentId),
          eq(matchesTable.round, nextRound),
        ),
      )
      .orderBy(matchesTable.matchNumber);

    const nextMatchIndex = Math.floor((match.matchNumber - 1) / 2);
    const nextMatch = nextRoundMatches[nextMatchIndex];
    if (nextMatch) {
      const isP1 = (match.matchNumber - 1) % 2 === 0;
      await db
        .update(matchesTable)
        .set(isP1 ? { player1Id: null } : { player2Id: null })
        .where(eq(matchesTable.id, nextMatch.id));
    }
  }

  // Reset match
  const [reverted] = await db
    .update(matchesTable)
    .set({
      status: "pending",
      winnerId: null,
      score1: null,
      score2: null,
      isDraw: false,
      completedAt: null,
    })
    .where(eq(matchesTable.id, params.data.id))
    .returning();

  // Remove from history
  await db
    .delete(resultHistoryTable)
    .where(eq(resultHistoryTable.matchId, params.data.id));

  // Log revert action
  {
    const p1Ids = [match.player1Id, match.player2Id].filter(Boolean) as number[];
    const namePlayers = p1Ids.length > 0 ? await db.select().from(playersTable).where(inArray(playersTable.id, p1Ids)) : [];
    const nm = new Map(namePlayers.map((p) => [p.id, p.name]));
    const p1n = nm.get(match.player1Id ?? 0) ?? "TBD";
    const p2n = nm.get(match.player2Id ?? 0) ?? "TBD";
    await logAction({ tournamentId: match.tournamentId, actionType: "match_result_reverted", description: `Cofnięto wynik R${match.round}M${match.matchNumber}: ${p1n} ${match.score1 ?? 0}:${match.score2 ?? 0} ${p2n}`, matchId: match.id });
    // Also mark the original match_result_submitted log as undone
    await db.update(actionLogTable).set({ isUndone: true }).where(
      and(
        eq(actionLogTable.tournamentId, match.tournamentId),
        eq(actionLogTable.actionType, "match_result_submitted"),
        eq(actionLogTable.isUndone, false),
        sql`${actionLogTable.matchId} = ${match.id}`,
      ),
    );
  }

  const [enriched] = await enrichMatches([reverted]);
  res.json(enriched);
});

export default router;
