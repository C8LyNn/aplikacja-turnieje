export interface MarvelSeededParticipant {
  playerId: number;
  seed: number;
}

export interface MarvelGroupAssignment {
  position: number;
  playerIds: number[];
}

export interface MarvelSubmittedPlacement {
  playerId: number;
  kills?: number | null;
}

export interface MarvelRankedGroupEntry {
  playerId: number;
  placement: number;
  kills: number | null;
  qualified: boolean;
}

export { calculateMarvelRoundParticipantCounts } from "@workspace/game-catalog";
import { buildSnakeGroupPlacements } from "./stage-placement";

function positiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function chunkPlayers(
  playerIds: readonly number[],
  groupSize: number,
): MarvelGroupAssignment[] {
  if (!positiveInteger(groupSize)) {
    throw new RangeError("groupSize must be a positive integer.");
  }
  if (playerIds.length === 0) {
    throw new RangeError("At least one player is required.");
  }
  return Array.from(
    { length: Math.ceil(playerIds.length / groupSize) },
    (_, groupIndex) => ({
      position: groupIndex + 1,
      playerIds: playerIds.slice(
        groupIndex * groupSize,
        (groupIndex + 1) * groupSize,
      ),
    }),
  );
}

export function buildMarvelInitialGroups(
  participants: readonly MarvelSeededParticipant[],
  groupSize: number,
): MarvelGroupAssignment[] {
  const ordered = [...participants].sort(
    (left, right) => left.seed - right.seed || left.playerId - right.playerId,
  );
  if (new Set(ordered.map((entry) => entry.playerId)).size !== ordered.length) {
    throw new RangeError("Initial Marvel participants must be unique.");
  }
  if (!positiveInteger(groupSize)) {
    throw new RangeError("groupSize must be a positive integer.");
  }
  const groupCount = Math.ceil(ordered.length / groupSize);
  const smallerGroupSize = Math.floor(ordered.length / groupCount);
  const largerGroupCount = ordered.length % groupCount;
  const groupSizes = Array.from(
    { length: groupCount },
    (_, index) => smallerGroupSize + (index < largerGroupCount ? 1 : 0),
  );
  const placements = buildSnakeGroupPlacements(
    ordered.map((participant) => ({
      participantKey: String(participant.playerId),
      playerId: participant.playerId,
      seed: participant.seed,
    })),
    groupSizes,
  );
  return groupSizes.map((_, groupIndex) => ({
    position: groupIndex + 1,
    playerIds: placements
      .filter((placement) => placement.groupIndex === groupIndex)
      .sort((left, right) => left.groupPosition - right.groupPosition)
      .map((placement) => placement.participant.playerId),
  }));
}

export function rankMarvelGroupResult(
  expectedPlayerIds: readonly number[],
  placements: readonly MarvelSubmittedPlacement[],
  advancingCount: number,
  finalRound: boolean,
): MarvelRankedGroupEntry[] {
  const expected = [...expectedPlayerIds].sort((left, right) => left - right);
  const submitted = placements.map((entry) => entry.playerId);
  const sortedSubmitted = [...submitted].sort((left, right) => left - right);
  if (
    placements.length !== expected.length ||
    new Set(submitted).size !== submitted.length ||
    sortedSubmitted.some((playerId, index) => playerId !== expected[index]) ||
    placements.some(
      (entry) =>
        entry.kills != null &&
        (!Number.isSafeInteger(entry.kills) || entry.kills < 0),
    )
  ) {
    throw new RangeError(
      "A Marvel result must rank every group participant exactly once.",
    );
  }
  return placements.map((entry, index) => ({
    playerId: entry.playerId,
    placement: index + 1,
    kills: entry.kills ?? null,
    qualified: !finalRound && index < advancingCount,
  }));
}

/** Preserves each source group's qualifier block and merges adjacent blocks. */
export function buildMarvelPairedMergeGroups(
  qualifiersBySourceGroup: readonly (readonly number[])[],
  groupSize: number,
): MarvelGroupAssignment[] {
  const flattened = qualifiersBySourceGroup.flatMap((group) => [...group]);
  if (new Set(flattened).size !== flattened.length) {
    throw new RangeError("Marvel qualifiers must be unique.");
  }
  const groups = chunkPlayers(flattened, groupSize);
  if (
    groups.length > 1 &&
    groups.some((group) => group.playerIds.length !== groupSize)
  ) {
    throw new RangeError("A non-final Marvel round requires complete groups.");
  }
  return groups;
}

function seededUnitInterval(seedText: string): () => number {
  let state = 2166136261;
  for (const character of seedText) {
    state ^= character.charCodeAt(0);
    state = Math.imul(state, 16777619) >>> 0;
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildMarvelRandomGroups(
  playerIds: readonly number[],
  groupSize: number,
  randomSeed: string,
): MarvelGroupAssignment[] {
  if (!randomSeed.trim()) {
    throw new RangeError("randomSeed must be non-empty.");
  }
  const shuffled = [...playerIds];
  if (new Set(shuffled).size !== shuffled.length) {
    throw new RangeError("Marvel qualifiers must be unique.");
  }
  const random = seededUnitInterval(randomSeed);
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  const groups = chunkPlayers(shuffled, groupSize);
  if (
    groups.length > 1 &&
    groups.some((group) => group.playerIds.length !== groupSize)
  ) {
    throw new RangeError("A non-final Marvel round requires complete groups.");
  }
  return groups;
}

export function validateMarvelManualGroups(
  expectedPlayerIds: readonly number[],
  groups: readonly MarvelGroupAssignment[],
  groupSize: number,
): MarvelGroupAssignment[] {
  const orderedGroups = [...groups].sort(
    (left, right) => left.position - right.position,
  );
  if (
    orderedGroups.some((group, index) => group.position !== index + 1) ||
    orderedGroups.some(
      (group) =>
        group.playerIds.length === 0 || group.playerIds.length > groupSize,
    )
  ) {
    throw new RangeError(
      "Manual Marvel groups must be contiguous and cannot exceed groupSize.",
    );
  }
  if (
    orderedGroups.length > 1 &&
    orderedGroups.some((group) => group.playerIds.length !== groupSize)
  ) {
    throw new RangeError("A non-final Marvel round requires complete groups.");
  }
  const actual = orderedGroups.flatMap((group) => group.playerIds);
  const expected = [...expectedPlayerIds].sort((left, right) => left - right);
  const sortedActual = [...actual].sort((left, right) => left - right);
  if (
    new Set(actual).size !== actual.length ||
    sortedActual.length !== expected.length ||
    sortedActual.some((playerId, index) => playerId !== expected[index])
  ) {
    throw new RangeError(
      "Manual Marvel groups must contain every qualifier exactly once.",
    );
  }
  return orderedGroups.map((group) => ({
    position: group.position,
    playerIds: [...group.playerIds],
  }));
}
