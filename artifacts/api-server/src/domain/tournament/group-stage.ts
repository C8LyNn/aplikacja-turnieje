import { assignSeeds, type SeedingCriterion } from "./seeding";
import { buildSnakeGroupPlacements, nextPowerOfTwo, standardBracketSeedOrder } from "./stage-placement";

export interface GroupStageRankingEntry {
  playerId: number;
  groupKey: string;
  groupRank: number;
  stageSeed: number;
  matchWins: number;
  matchLosses: number;
  gameWins: number;
  gameLosses: number;
  gameDiff: number;
  /** V6.2 · groups with league rules only: draws and table points (point adjustments included). */
  matchDraws?: number;
  points?: number | null;
}

/** Matches that count for per-match rates: wins, losses and — in a points table — draws. */
function playedMatchCount(entry: GroupStageRankingEntry): number {
  return Math.max(1, entry.matchWins + entry.matchLosses + (entry.matchDraws ?? 0));
}

/**
 * V6.2 · groups ranked by league points compare qualifiers from different groups by points per match first
 * (draws and point adjustments count), before the win-rate criteria that know nothing about draws.
 */
function usesLeaguePoints(entries: readonly GroupStageRankingEntry[]): boolean {
  return entries.length > 0 && entries.every((entry) => typeof entry.points === "number");
}

const POINTS_PER_MATCH_FIRST: readonly SeedingCriterion[] = [
  { field: "metric:points_per_match", direction: "descending" },
];

export interface SeededGroupStageEntry extends GroupStageRankingEntry {
  nextStageSeed: number;
}

function positiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function groupKeyFromIndex(index: number): string {
  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError("Group index must be a non-negative integer.");
  }

  let value = index + 1;
  let key = "";
  while (value > 0) {
    value -= 1;
    key = String.fromCharCode(65 + (value % 26)) + key;
    value = Math.floor(value / 26);
  }
  return key;
}

export function calculateBalancedGroupSizes(
  participantCount: number,
  groupCount: number,
): number[] {
  if (!positiveInteger(participantCount) || participantCount < 2) {
    throw new RangeError("participantCount must be an integer of at least 2.");
  }
  if (
    !positiveInteger(groupCount) ||
    groupCount > Math.floor(participantCount / 2)
  ) {
    throw new RangeError(
      "groupCount must be between 1 and floor(participantCount / 2).",
    );
  }

  const smallerSize = Math.floor(participantCount / groupCount);
  const largerGroupCount = participantCount % groupCount;
  return Array.from(
    { length: groupCount },
    (_, index) => smallerSize + (index < largerGroupCount ? 1 : 0),
  );
}

export function calculateGroupQualifierCounts(
  groupSizes: readonly number[],
  qualifiersPerGroup: number,
): number[] {
  if (groupSizes.length === 0 || groupSizes.some((size) => !positiveInteger(size))) {
    throw new RangeError("groupSizes must contain positive integers.");
  }
  const largestGroupSize = Math.max(...groupSizes);
  if (
    !positiveInteger(qualifiersPerGroup) ||
    qualifiersPerGroup > largestGroupSize
  ) {
    throw new RangeError(
      "qualifiersPerGroup must be between 1 and the largest group size.",
    );
  }
  return groupSizes.map((size) => Math.min(size, qualifiersPerGroup));
}

export function calculateGroupAdvancingCount(
  participantCount: number,
  groupCount: number,
  qualifiersPerGroup: number,
): number {
  return calculateGroupQualifierCounts(
    calculateBalancedGroupSizes(participantCount, groupCount),
    qualifiersPerGroup,
  ).reduce((sum, count) => sum + count, 0);
}

export function buildSnakeGroupAssignments(
  participantCount: number,
  groupCount: number,
): number[] {
  const groupSizes = calculateBalancedGroupSizes(participantCount, groupCount);
  return buildSnakeGroupPlacements(
    Array.from({ length: participantCount }, (_, index) => ({
      participantKey: String(index + 1),
      seed: index + 1,
    })),
    groupSizes,
  ).map((placement) => placement.groupIndex);
}

/**
 * Produces rank-band seeding: every group winner is placed before every runner-up,
 * then every third place, and so on. Within one band, normalized results break
 * ties before the participant's previous stage seed. V6.2: in groups with league
 * rules the first criterion is points per match (draws and point adjustments count).
 */
export function seedQualifiedGroupEntries<T extends GroupStageRankingEntry>(
  entries: readonly T[],
): Array<T & { nextStageSeed: number }> {
  const league = usesLeaguePoints(entries);
  const result = assignSeeds(
    entries.map((entry) => {
      const matches = playedMatchCount(entry);
      return {
        participantKey: String(entry.playerId),
        displayName: String(entry.playerId),
        previousSeed: entry.stageSeed,
        rankBand: entry.groupRank,
        metrics: {
          ...(league ? { points_per_match: entry.points! / matches } : {}),
          match_win_rate: entry.matchWins / matches,
          game_diff_per_match: entry.gameDiff / matches,
          game_wins_per_match: entry.gameWins / matches,
          group_key: entry.groupKey,
        },
        source: entry,
      };
    }),
    {
      type: "rank_bands",
      withinBand: [
        ...(league ? POINTS_PER_MATCH_FIRST : []),
        { field: "metric:match_win_rate", direction: "descending" },
        { field: "metric:game_diff_per_match", direction: "descending" },
        { field: "metric:game_wins_per_match", direction: "descending" },
        { field: "previous_seed", direction: "ascending" },
        { field: "metric:group_key", direction: "ascending" },
      ],
    },
  );
  if ("problems" in result) {
    throw new Error(`Unable to seed group qualifiers: ${result.problems.map((problem) => problem.code).join(", ")}`);
  }
  return result.seeded.map(({ entry, seed }) => ({
    ...entry.source,
    nextStageSeed: seed,
  }));
}

/**
 * Produces one global qualification order across all groups. Raw totals are
 * normalized per played match so uneven group sizes remain comparable. V6.2: in
 * groups with league rules points per match come first.
 */
export function seedQualifiedGroupEntriesGlobally<T extends GroupStageRankingEntry>(
  entries: readonly T[],
): Array<T & { nextStageSeed: number }> {
  const league = usesLeaguePoints(entries);
  const result = assignSeeds(
    entries.map((entry) => {
      const matches = playedMatchCount(entry);
      return {
        participantKey: String(entry.playerId),
        displayName: String(entry.playerId),
        previousSeed: entry.stageSeed,
        metrics: {
          ...(league ? { points_per_match: entry.points! / matches } : {}),
          match_win_rate: entry.matchWins / matches,
          game_diff_per_match: entry.gameDiff / matches,
          game_wins_per_match: entry.gameWins / matches,
          group_rank: entry.groupRank,
          group_key: entry.groupKey,
        },
        source: entry,
      };
    }),
    {
      type: "ordered_criteria",
      criteria: [
        ...(league ? POINTS_PER_MATCH_FIRST : []),
        { field: "metric:match_win_rate", direction: "descending" },
        { field: "metric:game_diff_per_match", direction: "descending" },
        { field: "metric:game_wins_per_match", direction: "descending" },
        { field: "metric:group_rank", direction: "ascending" },
        { field: "previous_seed", direction: "ascending" },
        { field: "metric:group_key", direction: "ascending" },
      ],
    },
  );
  if ("problems" in result) {
    throw new Error(`Unable to seed group qualifiers globally: ${result.problems.map((problem) => problem.code).join(", ")}`);
  }
  return result.seeded.map(({ entry, seed }) => ({
    ...entry.source,
    nextStageSeed: seed,
  }));
}

/** Minimum-cost assignment (Hungarian method) for a square matrix; returns the column chosen for each row. */
function minimumCostAssignment(cost: readonly (readonly number[])[]): number[] {
  const size = cost.length;
  const rowPotential = new Array<number>(size + 1).fill(0);
  const columnPotential = new Array<number>(size + 1).fill(0);
  const rowOfColumn = new Array<number>(size + 1).fill(0);
  const way = new Array<number>(size + 1).fill(0);
  for (let row = 1; row <= size; row += 1) {
    rowOfColumn[0] = row;
    let column = 0;
    const minimum = new Array<number>(size + 1).fill(Number.POSITIVE_INFINITY);
    const used = new Array<boolean>(size + 1).fill(false);
    do {
      used[column] = true;
      const currentRow = rowOfColumn[column]!;
      let delta = Number.POSITIVE_INFINITY;
      let nextColumn = 0;
      for (let candidate = 1; candidate <= size; candidate += 1) {
        if (used[candidate]) continue;
        const reduced = cost[currentRow - 1]![candidate - 1]! - rowPotential[currentRow]! - columnPotential[candidate]!;
        if (reduced < minimum[candidate]!) {
          minimum[candidate] = reduced;
          way[candidate] = column;
        }
        if (minimum[candidate]! < delta) {
          delta = minimum[candidate]!;
          nextColumn = candidate;
        }
      }
      for (let candidate = 0; candidate <= size; candidate += 1) {
        if (used[candidate]) {
          const owner = rowOfColumn[candidate]!;
          rowPotential[owner] = rowPotential[owner]! + delta;
          columnPotential[candidate] = columnPotential[candidate]! - delta;
        } else {
          minimum[candidate] = minimum[candidate]! - delta;
        }
      }
      column = nextColumn;
    } while (rowOfColumn[column] !== 0);
    do {
      const previous = way[column]!;
      rowOfColumn[column] = rowOfColumn[previous]!;
      column = previous;
    } while (column !== 0);
  }
  const columnOfRow = new Array<number>(size).fill(-1);
  for (let column = 1; column <= size; column += 1) {
    if (rowOfColumn[column] !== 0) columnOfRow[rowOfColumn[column]! - 1] = column - 1;
  }
  return columnOfRow;
}

/**
 * V6.2 · keeps qualifiers from the same group apart in a seeded elimination bracket (single or double
 * elimination with the standard seed placement). Seeds are only exchanged between qualifiers with the same group
 * place, so group winners keep the winners' seeds, runners-up the runners-up' seeds and so on, and the order of the
 * group winners is never touched. Each lower place is laid out so it meets its own group's qualifiers as late as
 * possible — two per group end up in opposite halves and can meet at the earliest in the final, as
 * ADR_TOURNAMENT_STAGES_V1 §9 required (A1–B2, B1–A2). Among equally separated layouts the one closest to the
 * incoming order wins, so a separation never reshuffles more than it has to. Deterministic.
 */
export function separateGroupMatesInBracket<T extends { groupKey: string; groupRank: number; nextStageSeed: number }>(
  entries: readonly T[],
): T[] {
  const result = entries.map((entry) => ({ ...entry }));
  if (result.length < 3) return result;
  const bracketSize = nextPowerOfTwo(result.length);
  const rounds = Math.log2(bracketSize);
  const slotOfSeed = new Map(standardBracketSeedOrder(bracketSize).map((seed, slot) => [seed, slot]));
  /** Round in which two seeds can meet at the earliest (1 = first round, `rounds` = final). */
  const meetingRound = (leftSeed: number, rightSeed: number): number => {
    const left = slotOfSeed.get(leftSeed)!;
    const right = slotOfSeed.get(rightSeed)!;
    let round = 1;
    while (left >> round !== right >> round) round += 1;
    return round;
  };
  // An earlier meeting costs 16× more than a meeting one round later; the distance from the incoming seed only
  // decides between layouts that separate equally well (the scale keeps it below one separation step).
  const separationCost = (round: number) => 16 ** (rounds - round);
  const scale = result.length * result.length + 1;
  const bands = [...new Set(result.map((entry) => entry.groupRank))].sort((left, right) => left - right);
  const placed = result.filter((entry) => entry.groupRank === bands[0]);
  for (const band of bands.slice(1)) {
    const members = result
      .filter((entry) => entry.groupRank === band)
      .sort((left, right) => left.nextStageSeed - right.nextStageSeed);
    // One qualifier per group and place is the only shape this can rearrange safely.
    if (new Set(members.map((member) => member.groupKey)).size !== members.length) {
      return entries.map((entry) => ({ ...entry }));
    }
    const seeds = members.map((member) => member.nextStageSeed);
    const cost = members.map((member) => {
      const mates = placed.filter((other) => other.groupKey === member.groupKey);
      return seeds.map((seed) =>
        mates.reduce((sum, mate) => sum + separationCost(meetingRound(seed, mate.nextStageSeed)), 0) * scale
        + Math.abs(seed - member.nextStageSeed));
    });
    const assignment = minimumCostAssignment(cost);
    members.forEach((member, index) => {
      member.nextStageSeed = seeds[assignment[index]!]!;
    });
    placed.push(...members);
  }
  return result;
}
