import {
  isLeagueDraw,
  type LeagueRules,
  type LeagueTieBreaker,
} from "./league-rules";

export type StandingsFormat =
  | "single_elimination"
  | "round_robin"
  | "swiss"
  | "group_stage"
  | "double_elimination";
export type StandingsResultType = "played" | "walkover" | "bye" | "no_contest";

export interface StandingsPlayer {
  id: number;
  name: string;
  rank?: string | null;
  teamName?: string | null;
  country?: string | null;
  seed?: number | null;
  status: "active" | "eliminated" | "winner";
}

export interface StandingsMatch {
  status: "pending" | "in_progress" | "postponed" | "completed" | "cancelled";
  resultType?: StandingsResultType | null;
  player1Id?: number | null;
  player2Id?: number | null;
  winnerId?: number | null;
  score1?: number | null;
  score2?: number | null;
}

export interface StandingProjection {
  playerId: number;
  playerName: string;
  rankName: string | null;
  teamName: string | null;
  country: string | null;
  seed: number | null;
  status: StandingsPlayer["status"];
  rank: number;
  matchesPlayed: number;
  matchWins: number;
  matchLosses: number;
  gameWins: number;
  gameLosses: number;
  gameDiff: number;
  buchholz: number | null;
  // V5.3 fields exist only on points tables (stages with league rules); tables without rules keep the
  // pre-V5.3 shape, so these are optional.
  /** V5.3: draws. */
  matchDraws?: number;
  /** V5.3: league points; null when the stage has no league rules (ranked by match wins). */
  points?: number | null;
  /**
   * V5.3: what placed this row below the previous one ("points", a tie-breaker, or "seed" when every
   * criterion left them level). null for the first row and for stages without league rules.
   */
  decidedBy?: "points" | LeagueTieBreaker | "seed" | null;
  /** V5.3: true when all configured criteria left this row level with a neighbour (seed decided). */
  tiedAfterAllRules?: boolean;
  /** V5.5: net bonus/penalty included in `points` (absent when zero). */
  pointAdjustment?: number;
}

interface MutableRecord {
  matchesPlayed: number;
  matchWins: number;
  matchLosses: number;
  gameWins: number;
  gameLosses: number;
  opponents: number[];
}

function seedValue(seed: number | null): number {
  return seed ?? Number.MAX_SAFE_INTEGER;
}

export function calculateMatchRecordStandings(
  players: StandingsPlayer[],
  matches: StandingsMatch[],
  format: StandingsFormat,
  leagueRules: LeagueRules | null = null,
  /** V5.5: active point adjustments per player (points tables only). */
  pointAdjustments: ReadonlyMap<number, number> | null = null,
): StandingProjection[] {
  if (leagueRules && (format === "round_robin" || format === "group_stage")) {
    return calculateLeagueStandings(players, matches, leagueRules, pointAdjustments);
  }
  const records = new Map<number, MutableRecord>();
  for (const player of players) {
    records.set(player.id, {
      matchesPlayed: 0,
      matchWins: 0,
      matchLosses: 0,
      gameWins: 0,
      gameLosses: 0,
      opponents: [],
    });
  }

  // pairKey -> wins per player (a home-and-away league can have two results per pair).
  const headToHead = new Map<string, Map<number, number>>();
  for (const match of matches) {
    if (match.status !== "completed" || !match.resultType || !match.player1Id) continue;
    const player1 = records.get(match.player1Id);
    const player2 = match.player2Id == null ? null : records.get(match.player2Id);
    if (!player1) continue;

    if (match.resultType === "bye") {
      if (format === "swiss" && match.winnerId === match.player1Id) {
        player1.matchesPlayed += 1;
        player1.matchWins += 1;
      }
      continue;
    }

    if (match.resultType === "no_contest" || !player2 || !match.player2Id) continue;
    if (match.resultType !== "played" && match.resultType !== "walkover") continue;
    if (match.winnerId !== match.player1Id && match.winnerId !== match.player2Id) continue;

    player1.matchesPlayed += 1;
    player2.matchesPlayed += 1;
    player1.opponents.push(match.player2Id);
    player2.opponents.push(match.player1Id);

    const winner = match.winnerId === match.player1Id ? player1 : player2;
    const loser = match.winnerId === match.player1Id ? player2 : player1;
    winner.matchWins += 1;
    loser.matchLosses += 1;

    const pairKey = [match.player1Id, match.player2Id].sort((a, b) => a - b).join(":");
    const pairWins = headToHead.get(pairKey) ?? new Map<number, number>();
    pairWins.set(match.winnerId, (pairWins.get(match.winnerId) ?? 0) + 1);
    headToHead.set(pairKey, pairWins);

    if (match.resultType === "played" && match.score1 != null && match.score2 != null) {
      player1.gameWins += match.score1;
      player1.gameLosses += match.score2;
      player2.gameWins += match.score2;
      player2.gameLosses += match.score1;
    }
  }

  const matchWins = new Map(
    [...records.entries()].map(([playerId, record]) => [playerId, record.matchWins]),
  );
  const winsGroups = new Map<number, number[]>();
  for (const [playerId, record] of records) {
    const group = winsGroups.get(record.matchWins) ?? [];
    group.push(playerId);
    winsGroups.set(record.matchWins, group);
  }

  const standings = players.map<StandingProjection>((player) => {
    const record = records.get(player.id)!;
    const buchholz = format === "swiss"
      ? record.opponents.reduce((sum, opponentId) => sum + (matchWins.get(opponentId) ?? 0), 0)
      : null;
    return {
      playerId: player.id,
      playerName: player.name,
      rankName: player.rank ?? null,
      teamName: player.teamName ?? null,
      country: player.country ?? null,
      seed: player.seed ?? null,
      status: player.status,
      rank: 0,
      matchesPlayed: record.matchesPlayed,
      matchWins: record.matchWins,
      matchLosses: record.matchLosses,
      gameWins: record.gameWins,
      gameLosses: record.gameLosses,
      gameDiff: record.gameWins - record.gameLosses,
      buchholz,
      // No V5.3 keys here: a table without league rules keeps the exact pre-V5.3 response shape.
    };
  });

  standings.sort((left, right) => {
    if (right.matchWins !== left.matchWins) return right.matchWins - left.matchWins;

    if (format === "round_robin") {
      const tied = winsGroups.get(left.matchWins) ?? [];
      if (tied.length === 2 && tied.includes(left.playerId) && tied.includes(right.playerId)) {
        const pairKey = [left.playerId, right.playerId].sort((a, b) => a - b).join(":");
        const pairWins = headToHead.get(pairKey);
        const leftWins = pairWins?.get(left.playerId) ?? 0;
        const rightWins = pairWins?.get(right.playerId) ?? 0;
        if (leftWins > rightWins) return -1;
        if (rightWins > leftWins) return 1;
      }
    }

    if (format === "swiss" && right.buchholz !== left.buchholz) {
      return (right.buchholz ?? 0) - (left.buchholz ?? 0);
    }
    if (right.gameDiff !== left.gameDiff) return right.gameDiff - left.gameDiff;
    if (right.gameWins !== left.gameWins) return right.gameWins - left.gameWins;
    if (seedValue(left.seed) !== seedValue(right.seed)) {
      return seedValue(left.seed) - seedValue(right.seed);
    }
    return left.playerId - right.playerId;
  });

  standings.forEach((standing, index) => {
    standing.rank = index + 1;
  });
  return standings;
}

interface LeagueRecord {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  scoreFor: number;
  scoreAgainst: number;
  points: number;
}

interface LeagueResult {
  player1Id: number;
  player2Id: number;
  /** null = draw */
  winnerId: number | null;
}

/**
 * V5.3 league table: points (win/draw/loss from the rules), then the configured tie-breakers in order.
 * Each criterion only splits the participants that are still level; head-to-head is computed among exactly
 * those participants. Walkovers give win/loss points without score; no-contest results are ignored.
 */
function calculateLeagueStandings(
  players: StandingsPlayer[],
  matches: StandingsMatch[],
  rules: LeagueRules,
  pointAdjustments: ReadonlyMap<number, number> | null = null,
): StandingProjection[] {
  const records = new Map<number, LeagueRecord>();
  for (const player of players) {
    records.set(player.id, { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, scoreFor: 0, scoreAgainst: 0, points: 0 });
  }
  const results: LeagueResult[] = [];
  for (const match of matches) {
    if (match.status !== "completed" || match.player1Id == null || match.player2Id == null) continue;
    const player1 = records.get(match.player1Id);
    const player2 = records.get(match.player2Id);
    if (!player1 || !player2) continue;
    if (match.resultType !== "played" && match.resultType !== "walkover") continue;

    const draw = rules.allowDraws && isLeagueDraw(match);
    if (!draw && match.winnerId !== match.player1Id && match.winnerId !== match.player2Id) continue;

    player1.matchesPlayed += 1;
    player2.matchesPlayed += 1;
    if (match.resultType === "played" && match.score1 != null && match.score2 != null) {
      player1.scoreFor += match.score1;
      player1.scoreAgainst += match.score2;
      player2.scoreFor += match.score2;
      player2.scoreAgainst += match.score1;
    }
    if (draw) {
      player1.draws += 1;
      player2.draws += 1;
      player1.points += rules.points.draw;
      player2.points += rules.points.draw;
      results.push({ player1Id: match.player1Id, player2Id: match.player2Id, winnerId: null });
      continue;
    }
    const winner = match.winnerId === match.player1Id ? player1 : player2;
    const loser = winner === player1 ? player2 : player1;
    winner.wins += 1;
    loser.losses += 1;
    winner.points += rules.points.win;
    loser.points += rules.points.loss;
    results.push({ player1Id: match.player1Id, player2Id: match.player2Id, winnerId: match.winnerId! });
  }

  // V5.5: bonuses and penalties change only the points total; head-to-head and score columns stay as played.
  for (const [playerId, adjustment] of pointAdjustments ?? []) {
    const record = records.get(playerId);
    if (record) record.points += adjustment;
  }
  const seedOf = new Map(players.map((player) => [player.id, player.seed ?? null]));
  const decidedBy = new Map<number, StandingProjection["decidedBy"]>();
  const tied = new Set<number>();

  const criterionValue = (criterion: LeagueTieBreaker, group: number[]): Map<number, number> => {
    const values = new Map<number, number>();
    if (criterion === "head_to_head") {
      const members = new Set(group);
      for (const id of group) values.set(id, 0);
      for (const result of results) {
        if (!members.has(result.player1Id) || !members.has(result.player2Id)) continue;
        if (result.winnerId == null) {
          values.set(result.player1Id, values.get(result.player1Id)! + rules.points.draw);
          values.set(result.player2Id, values.get(result.player2Id)! + rules.points.draw);
        } else {
          const loserId = result.winnerId === result.player1Id ? result.player2Id : result.player1Id;
          values.set(result.winnerId, values.get(result.winnerId)! + rules.points.win);
          values.set(loserId, values.get(loserId)! + rules.points.loss);
        }
      }
      return values;
    }
    for (const id of group) {
      const record = records.get(id)!;
      values.set(
        id,
        criterion === "score_difference" ? record.scoreFor - record.scoreAgainst
          : criterion === "scored" ? record.scoreFor
            : record.wins,
      );
    }
    return values;
  };

  const bySeed = (left: number, right: number) =>
    seedValue(seedOf.get(left) ?? null) - seedValue(seedOf.get(right) ?? null) || left - right;

  const resolve = (group: number[], criterionIndex: number): number[] => {
    if (group.length <= 1) return group;
    if (criterionIndex >= rules.tieBreakers.length) {
      const ordered = [...group].sort(bySeed);
      ordered.forEach((id, index) => {
        tied.add(id);
        if (index > 0) decidedBy.set(id, "seed");
      });
      return ordered;
    }
    const criterion = rules.tieBreakers[criterionIndex]!;
    const values = criterionValue(criterion, group);
    const buckets = new Map<number, number[]>();
    for (const id of group) {
      const value = values.get(id)!;
      buckets.set(value, [...(buckets.get(value) ?? []), id]);
    }
    const ordered: number[] = [];
    [...buckets.entries()]
      .sort((left, right) => right[0] - left[0])
      .forEach(([, bucket], index) => {
        const resolved = resolve(bucket, criterionIndex + 1);
        if (index > 0) decidedBy.set(resolved[0]!, criterion);
        ordered.push(...resolved);
      });
    return ordered;
  };

  const pointGroups = new Map<number, number[]>();
  for (const player of players) {
    const points = records.get(player.id)!.points;
    pointGroups.set(points, [...(pointGroups.get(points) ?? []), player.id]);
  }
  const order: number[] = [];
  [...pointGroups.entries()]
    .sort((left, right) => right[0] - left[0])
    .forEach(([, group], index) => {
      const resolved = resolve([...group].sort((left, right) => left - right), 0);
      if (index > 0) decidedBy.set(resolved[0]!, "points");
      order.push(...resolved);
    });

  const playerById = new Map(players.map((player) => [player.id, player]));
  return order.map((playerId, index) => {
    const player = playerById.get(playerId)!;
    const record = records.get(playerId)!;
    return {
      playerId,
      playerName: player.name,
      rankName: player.rank ?? null,
      teamName: player.teamName ?? null,
      country: player.country ?? null,
      seed: player.seed ?? null,
      status: player.status,
      rank: index + 1,
      matchesPlayed: record.matchesPlayed,
      matchWins: record.wins,
      matchLosses: record.losses,
      gameWins: record.scoreFor,
      gameLosses: record.scoreAgainst,
      gameDiff: record.scoreFor - record.scoreAgainst,
      buchholz: null,
      matchDraws: record.draws,
      points: record.points,
      decidedBy: index === 0 ? null : decidedBy.get(playerId) ?? null,
      tiedAfterAllRules: tied.has(playerId),
      ...(pointAdjustments?.get(playerId) ? { pointAdjustment: pointAdjustments.get(playerId)! } : {}),
    };
  });
}
