import type { StandingProjection, StandingsMatch, StandingsPlayer } from "./standings";

export interface SwissPairing {
  round: number;
  matchNumber: number;
  player1Id: number;
  player2Id: number | null;
  resultType: "bye" | null;
}

type Pair = [number, number];
type PairingCost = { distance: number; rematches: number };

// Score distance first, rematches second; stable standing/seed/ID breaks ties.
// Exact matching is bounded to 16 entrants. Larger fields use bounded sweeps.
function chooseScoreFirstPairs(
  ids: number[],
  winsById: Map<number, number>,
  previousOpponents: Map<number, Set<number>>,
): Pair[] {
  const cost = ([a, b]: Pair): PairingCost => ({
    distance: Math.abs((winsById.get(a) ?? 0) - (winsById.get(b) ?? 0)),
    rematches: previousOpponents.get(a)?.has(b) ? 1 : 0,
  });
  const strictlyBetter = (a: PairingCost, b: PairingCost) =>
    a.distance < b.distance || (a.distance === b.distance && a.rematches < b.rematches);
  const total = (pairs: Pair[]): PairingCost => pairs.map(cost).reduce(
    (sum, next) => ({ distance: sum.distance + next.distance, rematches: sum.rematches + next.rematches }),
    { distance: 0, rematches: 0 },
  );
  if (ids.length <= 16) {
    const completeMask = (1 << ids.length) - 1;
    const cache = new Map<number, PairingCost & { partner: number }>();
    const solve = (mask: number): PairingCost & { partner: number } => {
      if (mask === completeMask) return { distance: 0, rematches: 0, partner: -1 };
      const cached = cache.get(mask);
      if (cached) return cached;
      let first = 0;
      while ((mask & (1 << first)) !== 0) first += 1;
      let best: (PairingCost & { partner: number }) | undefined;
      for (let candidate = first + 1; candidate < ids.length; candidate += 1) {
        if ((mask & (1 << candidate)) !== 0) continue;
        const rest = solve(mask | (1 << first) | (1 << candidate));
        const pairCost = cost([ids[first], ids[candidate]]);
        const next = {
          distance: pairCost.distance + rest.distance,
          rematches: pairCost.rematches + rest.rematches,
          partner: candidate,
        };
        if (!best || strictlyBetter(next, best)) best = next;
      }
      if (!best) throw new Error("Unable to create a complete Swiss pairing.");
      cache.set(mask, best);
      return best;
    };
    const pairs: Pair[] = [];
    let mask = 0;
    while (mask !== completeMask) {
      let first = 0;
      while ((mask & (1 << first)) !== 0) first += 1;
      const partner = solve(mask).partner;
      pairs.push([ids[first], ids[partner]]);
      mask |= (1 << first) | (1 << partner);
    }
    return pairs;
  }
  const remaining = [...ids];
  const pairs: Pair[] = [];
  while (remaining.length > 0) {
    const first = remaining.shift()!;
    let best = 0;
    for (let i = 1; i < remaining.length; i += 1) {
      if (strictlyBetter(cost([first, remaining[i]]), cost([first, remaining[best]]))) best = i;
    }
    pairs.push([first, remaining.splice(best, 1)[0]]);
  }
  // Four FULL sweeps, not four exchanges across the entire tournament.
  for (let pass = 0; pass < 4; pass += 1) {
    let improved = false;
    for (let left = 0; left < pairs.length; left += 1) {
      rightSearch: for (let right = left + 1; right < pairs.length; right += 1) {
        const a = pairs[left], b = pairs[right];
        const old = total([a, b]);
        const alternatives: [Pair, Pair][] = [
          [[a[0], b[0]], [a[1], b[1]]],
          [[a[0], b[1]], [b[0], a[1]]],
        ];
        for (const replacement of alternatives) {
          if (!strictlyBetter(total(replacement), old)) continue;
          [pairs[left], pairs[right]] = replacement;
          improved = true;
          break rightSearch;
        }
      }
    }
    if (!improved) break;
  }
  // Dense history can require three simultaneous pair exchanges. Bound this
  // neighborhood to 64 entrants and two sweeps; no global optimum claim.
  if (pairs.length >= 3 && pairs.length <= 32) {
    const patterns: number[][] = [];
    const enumerate = (unused: number[], chosen: number[]): void => {
      if (!unused.length) { patterns.push(chosen); return; }
      for (let i = 1; i < unused.length; i += 1) {
        enumerate(unused.slice(1, i).concat(unused.slice(i + 1)), [...chosen, unused[0], unused[i]]);
      }
    };
    enumerate([0, 1, 2, 3, 4, 5], []);
    for (let pass = 0; pass < 2; pass += 1) {
      let improved = false;
      for (let left = 0; left < pairs.length; left += 1) {
        nextMiddle: for (let middle = left + 1; middle < pairs.length; middle += 1) {
          for (let right = middle + 1; right < pairs.length; right += 1) {
            const original = [pairs[left], pairs[middle], pairs[right]];
            const old = total(original);
            if (!old.distance && !old.rematches) continue;
            const six = original.flat();
            for (const pattern of patterns) {
              const replacement: [Pair, Pair, Pair] = [
                [six[pattern[0]], six[pattern[1]]],
                [six[pattern[2]], six[pattern[3]]],
                [six[pattern[4]], six[pattern[5]]],
              ];
              if (!strictlyBetter(total(replacement), old)) continue;
              [pairs[left], pairs[middle], pairs[right]] = replacement;
              improved = true;
              break nextMiddle;
            }
          }
        }
      }
      if (!improved) break;
    }
  }
  return pairs;
}

export function generateSwissPairings(params: {
  players: StandingsPlayer[];
  standings: StandingProjection[];
  previousMatches: StandingsMatch[];
  round: number;
}): SwissPairing[] {
  const playerById = new Map(params.players.map((player) => [player.id, player]));
  const rankById = new Map(params.standings.map((standing) => [standing.playerId, standing]));
  const ordered = params.standings
    .map((standing) => playerById.get(standing.playerId))
    .filter((player): player is StandingsPlayer => player != null && player.status === "active")
    .sort((a, b) => {
      const first = rankById.get(a.id)!, second = rankById.get(b.id)!;
      return first.rank - second.rank ||
        (first.seed ?? Number.MAX_SAFE_INTEGER) - (second.seed ?? Number.MAX_SAFE_INTEGER) ||
        a.id - b.id;
    });
  const previouslyPaired = new Map<number, Set<number>>();
  const byeCount = new Map<number, number>();
  for (const player of ordered) {
    previouslyPaired.set(player.id, new Set());
    byeCount.set(player.id, 0);
  }

  // Callers must supply this stage's history only, never earlier stages.
  for (const match of params.previousMatches) {
    if (match.status !== "completed" || !match.resultType || match.player1Id == null) continue;
    if (match.resultType === "bye") {
      if (byeCount.has(match.player1Id)) byeCount.set(match.player1Id, byeCount.get(match.player1Id)! + 1);
      continue;
    }
    if (match.player2Id == null) continue;
    previouslyPaired.get(match.player1Id)?.add(match.player2Id);
    previouslyPaired.get(match.player2Id)?.add(match.player1Id);
  }

  const pool = [...ordered];
  let byePlayer: StandingsPlayer | null = null;
  if (pool.length % 2 === 1) {
    const minimumByes = Math.min(...pool.map(player => byeCount.get(player.id) ?? 0));
    byePlayer = [...pool].reverse().find(player => byeCount.get(player.id) === minimumByes) ?? null;
    if (byePlayer) pool.splice(pool.findIndex((player) => player.id === byePlayer!.id), 1);
  }

  const winsById = new Map(params.standings.map(entry => [entry.playerId, entry.matchWins]));
  const result: SwissPairing[] = chooseScoreFirstPairs(
    pool.map(player => player.id), winsById, previouslyPaired,
  ).map(([player1Id, player2Id], index) => ({
    round: params.round, matchNumber: index + 1, player1Id, player2Id, resultType: null,
  }));

  if (byePlayer) {
    result.push({
      round: params.round,
      matchNumber: result.length + 1,
      player1Id: byePlayer.id,
      player2Id: null,
      resultType: "bye",
    });
  }
  return result;
}
