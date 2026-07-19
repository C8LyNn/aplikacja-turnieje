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
  const largestGroupSize = Math.max(...groupSizes);
  const assignments: number[] = [];

  for (let tier = 0; tier < largestGroupSize; tier += 1) {
    const groupIndexes = Array.from({ length: groupCount }, (_, index) => index);
    if (tier % 2 === 1) groupIndexes.reverse();
    for (const groupIndex of groupIndexes) {
      if (groupSizes[groupIndex] > tier) assignments.push(groupIndex);
    }
  }

  if (assignments.length !== participantCount) {
    throw new Error("Unable to build a complete snake group assignment.");
  }
  return assignments;
}

function compareRate(
  leftValue: number,
  leftDivisor: number,
  rightValue: number,
  rightDivisor: number,
): number {
  return rightValue * leftDivisor - leftValue * rightDivisor;
}

/**
 * Produces rank-band seeding: every group winner is placed before every runner-up,
 * then every third place, and so on. Within one band, normalized results break
 * ties before the participant's previous stage seed.
 */
export function seedQualifiedGroupEntries<T extends GroupStageRankingEntry>(
  entries: readonly T[],
): Array<T & { nextStageSeed: number }> {
  const ordered = [...entries].sort((left, right) => {
    if (left.groupRank !== right.groupRank) return left.groupRank - right.groupRank;

    const leftMatches = Math.max(1, left.matchWins + left.matchLosses);
    const rightMatches = Math.max(1, right.matchWins + right.matchLosses);

    const winRate = compareRate(
      left.matchWins,
      leftMatches,
      right.matchWins,
      rightMatches,
    );
    if (winRate !== 0) return winRate;

    const gameDiffRate = compareRate(
      left.gameDiff,
      leftMatches,
      right.gameDiff,
      rightMatches,
    );
    if (gameDiffRate !== 0) return gameDiffRate;

    const gameWinRate = compareRate(
      left.gameWins,
      leftMatches,
      right.gameWins,
      rightMatches,
    );
    if (gameWinRate !== 0) return gameWinRate;

    if (left.stageSeed !== right.stageSeed) return left.stageSeed - right.stageSeed;
    if (left.groupKey !== right.groupKey) return left.groupKey.localeCompare(right.groupKey);
    return left.playerId - right.playerId;
  });

  return ordered.map((entry, index) => ({
    ...entry,
    nextStageSeed: index + 1,
  }));
}
