import { assignSeeds } from "./seeding";
import { buildSnakeGroupPlacements } from "./stage-placement";

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
}

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
 * ties before the participant's previous stage seed.
 */
export function seedQualifiedGroupEntries<T extends GroupStageRankingEntry>(
  entries: readonly T[],
): Array<T & { nextStageSeed: number }> {
  const result = assignSeeds(
    entries.map((entry) => {
      const matches = Math.max(1, entry.matchWins + entry.matchLosses);
      return {
        participantKey: String(entry.playerId),
        displayName: String(entry.playerId),
        previousSeed: entry.stageSeed,
        rankBand: entry.groupRank,
        metrics: {
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
