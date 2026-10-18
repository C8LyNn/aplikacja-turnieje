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
const EXACT_MATCHING_LIMIT = 16;
const FALLBACK_SWAP_PASSES = 4;

// Owner S3: total absolute Swiss match-win gap comes FIRST, rematches SECOND.
// Stable input rank/seed/ID order is the final tie-break. Scoring/Buchholz is
// deliberately not modified by this pairing-only policy.
function chooseScoreFirstPairs(
  ids: number[],
  winsById: Map<number, number>,
  previousOpponents: Map<number, Set<number>>,
): Pair[] {
  const distance = (a: number, b: number): number =>
    Math.abs((winsById.get(a) ?? 0) - (winsById.get(b) ?? 0));
  const isRematch = (a: number, b: number): number =>
    previousOpponents.get(a)?.has(b) ? 1 : 0;
  const cost = ([a, b]: Pair): PairingCost => ({
    distance: distance(a, b), rematches: isRematch(a, b),
  });
  const strictlyBetter = (left: PairingCost, right: PairingCost): boolean =>
    left.distance < right.distance
    || (left.distance === right.distance && left.rematches < right.rematches);

  // Exact lexicographic minimum perfect matching for small stages.
  // The bitmask limit bounds the number of states at 2^16, rather than letting
  // an unbounded exhaustive search grow with the tournament.
  if (ids.length <= EXACT_MATCHING_LIMIT) {
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
        const remaining = solve(mask | (1 << first) | (1 << candidate));
        const next = {
          distance: distance(ids[first], ids[candidate]) + remaining.distance,
          rematches: isRematch(ids[first], ids[candidate]) + remaining.rematches,
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

  // Bounded deterministic fallback above 16 entrants. Start with score-first
  // greedy matching, then do at most FOUR full improvement sweeps. Each sweep
  // can repair multiple independent rematches (one swap per left slot), rather
  // than stopping after only four swaps for the entire tournament. Polynomial,
  // deterministic and complete; still no global optimum guarantee.
  const remaining = [...ids];
  const pairs: Pair[] = [];
  while (remaining.length > 0) {
    const first = remaining.shift()!;
    let bestIndex = 0;
    for (let index = 1; index < remaining.length; index += 1) {
      if (strictlyBetter(cost([first, remaining[index]]), cost([first, remaining[bestIndex]]))) {
        bestIndex = index;
      }
    }
    pairs.push([first, remaining.splice(bestIndex, 1)[0]]);
  }
  for (let pass = 0; pass < FALLBACK_SWAP_PASSES; pass += 1) {
    let improved = false;
    for (let left = 0; left < pairs.length; left += 1) {
      rightSearch: for (let right = left + 1; right < pairs.length; right += 1) {
        const a = pairs[left], b = pairs[right];
        const aCost = cost(a), bCost = cost(b);
        const oldCost = {
          distance: aCost.distance + bCost.distance,
          rematches: aCost.rematches + bCost.rematches,
        };
        const alternatives: Array<[Pair, Pair]> = [
          [[a[0], b[0]], [a[1], b[1]]],
          [[a[0], b[1]], [b[0], a[1]]],
        ];
        for (const [first, second] of alternatives) {
          const firstCost = cost(first), secondCost = cost(second);
          if (strictlyBetter({
            distance: firstCost.distance + secondCost.distance,
            rematches: firstCost.rematches + secondCost.rematches,
          }, oldCost)) {
            pairs[left] = first;
            pairs[right] = second;
            improved = true;
            break rightSearch;
          }
        }
      }
    }
    if (!improved) break;
  }
  // The 2-pair neighborhood can be locally stuck above 16 entrants even if
  // three matched pairs can be rearranged at identical score distance to
  // eliminate a repeated encounter. Search a strictly bounded 3-pair
  // neighborhood only for fields of up to 64 participants. This does not
  // claim global optimum; larger fields retain the existing 4-sweep fallback.
  if (pairs.length <= 32 && pairs.length >= 3) {
    const patterns: number[][] = [];
    const enumerate = (unused: number[], chosen: number[]): void => {
      if (unused.length === 0) {
        patterns.push(chosen);
        return;
      }
      for (let index = 1; index < unused.length; index += 1) {
        enumerate(
          unused.slice(1, index).concat(unused.slice(index + 1)),
          [...chosen, unused[0], unused[index]],
        );
      }
    };
    enumerate([0, 1, 2, 3, 4, 5], []); // 15 perfect matchings of six slots.

    for (let pass = 0; pass < 2; pass += 1) {
      let improved = false;
      for (let left = 0; left < pairs.length; left += 1) {
        nextMiddle: for (let middle = left + 1; middle < pairs.length; middle += 1) {
          for (let right = middle + 1; right < pairs.length; right += 1) {
            const original = [pairs[left], pairs[middle], pairs[right]];
            const oldCosts = original.map(cost);
            const oldCost: PairingCost = {
              distance: oldCosts.reduce((sum, item) => sum + item.distance, 0),
              rematches: oldCosts.reduce((sum, item) => sum + item.rematches, 0),
            };
            if (oldCost.distance === 0 && oldCost.rematches === 0) continue;
            const six = original.flat();
            for (const pattern of patterns) {
              const replacement: [Pair, Pair, Pair] = [
                [six[pattern[0]], six[pattern[1]]],
                [six[pattern[2]], six[pattern[3]]],
                [six[pattern[4]], six[pattern[5]]],
              ];
              const candidateCosts = replacement.map(cost);
              if (strictlyBetter({
                distance: candidateCosts.reduce((sum, item) => sum + item.distance, 0),
                rematches: candidateCosts.reduce((sum, item) => sum + item.rematches, 0),
              }, oldCost)) {
                pairs[left] = replacement[0];
                pairs[middle] = replacement[1];
                pairs[right] = replacement[2];
                improved = true;
                break nextMiddle;
              }
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
    .sort((left, right) => {
      const first = rankById.get(left.id)!, second = rankById.get(right.id)!;
      if (first.rank !== second.rank) return first.rank - second.rank;
      const leftSeed = first.seed ?? Number.MAX_SAFE_INTEGER;
      const rightSeed = second.seed ?? Number.MAX_SAFE_INTEGER;
      return leftSeed - rightSeed || left.id - right.id;
    });

  const previouslyPaired = new Map<number, Set<number>>();
  const stageByeCount = new Map<number, number>();
  for (const player of ordered) {
    previouslyPaired.set(player.id, new Set());
    stageByeCount.set(player.id, 0);
  }
  // S4/S4-H: caller MUST supply matches from this Swiss stage only.
  // Production callers filter matchesTable by stageId (or supply [] on R1).
  for (const match of params.previousMatches) {
    if (match.status !== "completed" || !match.resultType || match.player1Id == null) continue;
    if (match.resultType === "bye") {
      if (stageByeCount.has(match.player1Id)) {
        stageByeCount.set(match.player1Id, stageByeCount.get(match.player1Id)! + 1);
      }
      continue;
    }
    // played / no_contest / walkover all count as prior pairing.
    // Cancelled/postponed matches do not, and BYE has no phantom opponent.
    if (match.player2Id == null) continue;
    previouslyPaired.get(match.player1Id)?.add(match.player2Id);
    previouslyPaired.get(match.player2Id)?.add(match.player1Id);
  }

  const pool = [...ordered];
  let byePlayer: StandingsPlayer | null = null;
  if (pool.length % 2 === 1) {
    // Prefer anyone without a BYE; if exhausted, minimum count. At equal
    // counts use the LOWEST current standing, then deterministic seed/ID.
    const smallestCount = pool.reduce(
      (minimum, player) => Math.min(minimum, stageByeCount.get(player.id) ?? 0),
      Number.POSITIVE_INFINITY,
    );
    byePlayer = [...pool].reverse().find((player) => stageByeCount.get(player.id) === smallestCount) ?? null;
    if (byePlayer) pool.splice(pool.findIndex((player) => player.id === byePlayer!.id), 1);
  }

  const winsById = new Map(params.standings.map((entry) => [entry.playerId, entry.matchWins]));
  const pairs = chooseScoreFirstPairs(pool.map((player) => player.id), winsById, previouslyPaired);
  const result: SwissPairing[] = pairs.map(([player1Id, player2Id], index) => ({
    round: params.round,
    matchNumber: index + 1,
    player1Id,
    player2Id,
    resultType: null,
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
