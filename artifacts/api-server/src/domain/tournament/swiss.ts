import type { StandingProjection, StandingsMatch, StandingsPlayer } from "./standings";

export interface SwissPairing {
  round: number;
  matchNumber: number;
  player1Id: number;
  player2Id: number | null;
  resultType: "bye" | null;
}

export function generateSwissPairings(params: {
  players: StandingsPlayer[];
  standings: StandingProjection[];
  previousMatches: StandingsMatch[];
  round: number;
}): SwissPairing[] {
  const playerById = new Map(params.players.map((player) => [player.id, player]));
  const ordered = params.standings
    .map((standing) => playerById.get(standing.playerId))
    .filter((player): player is StandingsPlayer => player != null && player.status === "active");
  const previouslyPaired = new Map<number, Set<number>>();
  const priorBye = new Set<number>();
  for (const player of ordered) previouslyPaired.set(player.id, new Set());

  for (const match of params.previousMatches) {
    if (match.status !== "completed" || !match.resultType || !match.player1Id) continue;
    if (match.resultType === "bye") {
      priorBye.add(match.player1Id);
      continue;
    }
    if (match.player2Id == null) continue;
    previouslyPaired.get(match.player1Id)?.add(match.player2Id);
    previouslyPaired.get(match.player2Id)?.add(match.player1Id);
  }

  const pool = [...ordered];
  let byePlayer: StandingsPlayer | null = null;
  if (pool.length % 2 === 1) {
    const lowestFirst = [...pool].reverse();
    byePlayer = lowestFirst.find((player) => !priorBye.has(player.id)) ?? lowestFirst[0] ?? null;
    if (byePlayer) pool.splice(pool.findIndex((player) => player.id === byePlayer!.id), 1);
  }

  const paired = new Set<number>();
  const result: SwissPairing[] = [];
  let matchNumber = 1;
  for (let index = 0; index < pool.length; index += 1) {
    const player = pool[index];
    if (paired.has(player.id)) continue;
    let opponent = pool
      .slice(index + 1)
      .find((candidate) => !paired.has(candidate.id) && !previouslyPaired.get(player.id)?.has(candidate.id));
    opponent ??= pool.slice(index + 1).find((candidate) => !paired.has(candidate.id));
    if (!opponent) throw new Error("Unable to create a complete Swiss pairing.");
    paired.add(player.id);
    paired.add(opponent.id);
    result.push({
      round: params.round,
      matchNumber: matchNumber++,
      player1Id: player.id,
      player2Id: opponent.id,
      resultType: null,
    });
  }

  if (byePlayer) {
    result.push({
      round: params.round,
      matchNumber: matchNumber++,
      player1Id: byePlayer.id,
      player2Id: null,
      resultType: "bye",
    });
  }
  return result;
}
