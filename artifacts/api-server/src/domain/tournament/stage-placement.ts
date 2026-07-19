import { deterministicShuffle } from "./seeding";

export interface SeededParticipantRef {
  participantKey: string;
  seed: number;
}

export interface BracketSlot<T extends SeededParticipantRef> {
  slot: number;
  expectedSeed: number;
  participant: T | null;
}

export interface BracketFirstRoundMatch<T extends SeededParticipantRef> {
  matchNumber: number;
  player1: BracketSlot<T>;
  player2: BracketSlot<T>;
  byeWinner: T | null;
}

export interface GroupPlacement<T extends SeededParticipantRef> {
  participant: T;
  groupIndex: number;
  groupPosition: number;
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

export function nextPowerOfTwo(value: number): number {
  if (!positiveInteger(value)) throw new RangeError("value must be a positive integer.");
  return 2 ** Math.ceil(Math.log2(Math.max(2, value)));
}

export function standardBracketSeedOrder(size: number): number[] {
  if (!positiveInteger(size) || size < 2 || (size & (size - 1)) !== 0) {
    throw new RangeError("Bracket size must be a power of two of at least 2.");
  }
  if (size === 2) return [1, 2];
  const previous = standardBracketSeedOrder(size / 2);
  return previous.flatMap((seed) => [seed, size + 1 - seed]);
}

function validateUniquePositiveSeeds<T extends SeededParticipantRef>(participants: readonly T[]): void {
  if (participants.length === 0) throw new RangeError("At least one participant is required.");
  const keys = new Set<string>();
  const seeds = new Set<number>();
  for (const participant of participants) {
    if (!participant.participantKey.trim() || keys.has(participant.participantKey)) {
      throw new RangeError("participantKey values must be non-empty and unique.");
    }
    if (!positiveInteger(participant.seed) || seeds.has(participant.seed)) {
      throw new RangeError("Seeds must be positive and unique.");
    }
    keys.add(participant.participantKey);
    seeds.add(participant.seed);
  }
}

function validateSeedPermutation<T extends SeededParticipantRef>(participants: readonly T[]): void {
  validateUniquePositiveSeeds(participants);
  if (participants.some((participant) => participant.seed > participants.length)) {
    throw new RangeError(`Seeds must form a unique permutation from 1 to ${participants.length}.`);
  }
}

export function buildStandardSeededBracket<T extends SeededParticipantRef>(
  participants: readonly T[],
): {
  bracketSize: number;
  slots: Array<BracketSlot<T>>;
  firstRound: Array<BracketFirstRoundMatch<T>>;
} {
  validateSeedPermutation(participants);
  const bracketSize = nextPowerOfTwo(participants.length);
  const participantBySeed = new Map(participants.map((participant) => [participant.seed, participant]));
  const slots = standardBracketSeedOrder(bracketSize).map<BracketSlot<T>>((expectedSeed, index) => ({
    slot: index + 1,
    expectedSeed,
    participant: participantBySeed.get(expectedSeed) ?? null,
  }));
  const firstRound: Array<BracketFirstRoundMatch<T>> = [];
  for (let index = 0; index < slots.length; index += 2) {
    const player1 = slots[index];
    const player2 = slots[index + 1];
    const occupied = [player1.participant, player2.participant].filter((entry): entry is T => entry != null);
    firstRound.push({
      matchNumber: index / 2 + 1,
      player1,
      player2,
      byeWinner: occupied.length === 1 ? occupied[0] : null,
    });
  }
  return { bracketSize, slots, firstRound };
}

export function buildRandomBracket<T extends SeededParticipantRef>(
  participants: readonly T[],
  randomSeed: string,
): ReturnType<typeof buildStandardSeededBracket<T>> {
  validateSeedPermutation(participants);
  const shuffled = deterministicShuffle(participants, randomSeed);
  const bracketSize = nextPowerOfTwo(participants.length);
  const participantByPlacementSeed = new Map(
    shuffled.map((participant, index) => [index + 1, participant]),
  );
  const slots = standardBracketSeedOrder(bracketSize).map<BracketSlot<T>>((expectedSeed, index) => ({
    slot: index + 1,
    expectedSeed,
    participant: participantByPlacementSeed.get(expectedSeed) ?? null,
  }));
  const firstRound: Array<BracketFirstRoundMatch<T>> = [];
  for (let index = 0; index < slots.length; index += 2) {
    const player1 = slots[index];
    const player2 = slots[index + 1];
    const occupied = [player1.participant, player2.participant].filter((entry): entry is T => entry != null);
    firstRound.push({
      matchNumber: index / 2 + 1,
      player1,
      player2,
      byeWinner: occupied.length === 1 ? occupied[0] : null,
    });
  }
  return { bracketSize, slots, firstRound };
}

/** Highest remaining seed plays the lowest, second-highest plays second-lowest, etc. */
export function buildReseededRoundPairings<T extends SeededParticipantRef>(
  participants: readonly T[],
): Array<{ matchNumber: number; player1: T; player2: T | null; byeWinner: T | null }> {
  validateUniquePositiveSeeds(participants);
  const ordered = [...participants].sort((left, right) => left.seed - right.seed);
  const pairings: Array<{ matchNumber: number; player1: T; player2: T | null; byeWinner: T | null }> = [];
  while (ordered.length > 0) {
    const player1 = ordered.shift()!;
    const player2 = ordered.pop() ?? null;
    pairings.push({
      matchNumber: pairings.length + 1,
      player1,
      player2,
      byeWinner: player2 == null ? player1 : null,
    });
  }
  return pairings;
}

function validateGroupSizes(participantCount: number, groupSizes: readonly number[]): void {
  if (groupSizes.length === 0 || groupSizes.some((size) => !positiveInteger(size) || size < 2)) {
    throw new RangeError("groupSizes must contain group sizes of at least 2.");
  }
  if (groupSizes.reduce((sum, size) => sum + size, 0) !== participantCount) {
    throw new RangeError("groupSizes must add up to the participant count.");
  }
  if (Math.max(...groupSizes) - Math.min(...groupSizes) > 1) {
    throw new RangeError("Balanced groups may differ in size by at most one participant.");
  }
}

export function buildSnakeGroupPlacements<T extends SeededParticipantRef>(
  participants: readonly T[],
  groupSizes: readonly number[],
): Array<GroupPlacement<T>> {
  validateSeedPermutation(participants);
  validateGroupSizes(participants.length, groupSizes);
  const ordered = [...participants].sort((left, right) => left.seed - right.seed);
  const largestSize = Math.max(...groupSizes);
  const placements: Array<GroupPlacement<T>> = [];
  let participantIndex = 0;
  for (let tier = 0; tier < largestSize; tier += 1) {
    const groupIndexes = Array.from({ length: groupSizes.length }, (_, index) => index);
    if (tier % 2 === 1) groupIndexes.reverse();
    for (const groupIndex of groupIndexes) {
      if (groupSizes[groupIndex] <= tier) continue;
      placements.push({
        participant: ordered[participantIndex++],
        groupIndex,
        groupPosition: tier + 1,
      });
    }
  }
  return placements;
}

export function buildRandomGroupPlacements<T extends SeededParticipantRef>(
  participants: readonly T[],
  groupSizes: readonly number[],
  randomSeed: string,
): Array<GroupPlacement<T>> {
  validateSeedPermutation(participants);
  validateGroupSizes(participants.length, groupSizes);
  const shuffled = deterministicShuffle(participants, randomSeed);
  const placements: Array<GroupPlacement<T>> = [];
  let participantIndex = 0;
  for (let groupIndex = 0; groupIndex < groupSizes.length; groupIndex += 1) {
    for (let groupPosition = 1; groupPosition <= groupSizes[groupIndex]; groupPosition += 1) {
      placements.push({
        participant: shuffled[participantIndex++],
        groupIndex,
        groupPosition,
      });
    }
  }
  return placements;
}
