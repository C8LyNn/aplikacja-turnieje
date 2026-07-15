export type StandingsFormat = "single_elimination" | "round_robin" | "swiss";
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
): StandingProjection[] {
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

  const headToHead = new Map<string, number>();
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
    headToHead.set(pairKey, match.winnerId);

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
    };
  });

  standings.sort((left, right) => {
    if (right.matchWins !== left.matchWins) return right.matchWins - left.matchWins;

    if (format === "round_robin") {
      const tied = winsGroups.get(left.matchWins) ?? [];
      if (tied.length === 2 && tied.includes(left.playerId) && tied.includes(right.playerId)) {
        const pairKey = [left.playerId, right.playerId].sort((a, b) => a - b).join(":");
        const winner = headToHead.get(pairKey);
        if (winner === left.playerId) return -1;
        if (winner === right.playerId) return 1;
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
