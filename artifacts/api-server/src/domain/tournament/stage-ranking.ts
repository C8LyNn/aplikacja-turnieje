export interface SwissStageRankingEntry {
  participantKey: string;
  matchWins: number;
  buchholz: number;
  gameDiff: number;
  gameWins: number;
  stageSeed?: number | null;
}

export interface RoundRobinStageRankingEntry {
  participantKey: string;
  matchWins: number;
  gameDiff: number;
  gameWins: number;
  stageSeed?: number | null;
}

export interface RankedSwissStageEntry extends Omit<SwissStageRankingEntry, "stageSeed"> {
  stageSeed: number;
  rank: number;
}

export interface RankedRoundRobinStageEntry
  extends Omit<RoundRobinStageRankingEntry, "stageSeed"> {
  stageSeed: number;
  rank: number;
}

export type StageHeadToHeadStatus =
  | "pending"
  | "in_progress"
  | "postponed"
  | "completed"
  | "cancelled";

export type StageHeadToHeadResultType = "played" | "walkover" | "no_contest";

export interface StageHeadToHeadResult {
  participant1Key: string;
  participant2Key: string;
  status: StageHeadToHeadStatus;
  resultType?: StageHeadToHeadResultType | null;
  winnerKey?: string | null;
}

export type StageRankingProblemCode =
  | "MISSING_STAGE_SEED"
  | "INVALID_STAGE_SEED"
  | "DUPLICATE_STAGE_SEED";

export interface StageRankingProblem {
  code: StageRankingProblemCode;
  path: string;
  message: string;
}

export type StageRankingResult<T> =
  | { valid: true; standings: T[] }
  | { valid: false; problems: StageRankingProblem[] };

interface SeededEntry {
  stageSeed?: number | null;
}

function validateStageSeeds(entries: readonly SeededEntry[]): StageRankingProblem[] {
  const problems: StageRankingProblem[] = [];
  const firstIndexBySeed = new Map<number, number>();

  entries.forEach((entry, index) => {
    if (entry.stageSeed == null) {
      problems.push({
        code: "MISSING_STAGE_SEED",
        path: `entries[${index}].stageSeed`,
        message: "stageSeed is required to produce a total ranking order.",
      });
      return;
    }
    if (!Number.isInteger(entry.stageSeed) || entry.stageSeed <= 0) {
      problems.push({
        code: "INVALID_STAGE_SEED",
        path: `entries[${index}].stageSeed`,
        message: "stageSeed must be a positive integer.",
      });
      return;
    }

    const firstIndex = firstIndexBySeed.get(entry.stageSeed);
    if (firstIndex != null) {
      problems.push({
        code: "DUPLICATE_STAGE_SEED",
        path: `entries[${index}].stageSeed`,
        message: `stageSeed duplicates entries[${firstIndex}].stageSeed.`,
      });
      return;
    }
    firstIndexBySeed.set(entry.stageSeed, index);
  });

  return problems;
}

export function rankSwissStage(
  entries: readonly SwissStageRankingEntry[],
): StageRankingResult<RankedSwissStageEntry> {
  const problems = validateStageSeeds(entries);
  if (problems.length > 0) return { valid: false, problems };

  const standings = entries.map<RankedSwissStageEntry>((entry) => ({
    participantKey: entry.participantKey,
    matchWins: entry.matchWins,
    buchholz: entry.buchholz,
    gameDiff: entry.gameDiff,
    gameWins: entry.gameWins,
    stageSeed: entry.stageSeed!,
    rank: 0,
  }));

  standings.sort((left, right) => {
    if (right.matchWins !== left.matchWins) return right.matchWins - left.matchWins;
    if (right.buchholz !== left.buchholz) return right.buchholz - left.buchholz;
    if (right.gameDiff !== left.gameDiff) return right.gameDiff - left.gameDiff;
    if (right.gameWins !== left.gameWins) return right.gameWins - left.gameWins;
    return left.stageSeed - right.stageSeed;
  });
  standings.forEach((standing, index) => {
    standing.rank = index + 1;
  });

  return { valid: true, standings };
}

function pairMatches(
  result: StageHeadToHeadResult,
  participant1Key: string,
  participant2Key: string,
): boolean {
  return (
    (result.participant1Key === participant1Key && result.participant2Key === participant2Key) ||
    (result.participant1Key === participant2Key && result.participant2Key === participant1Key)
  );
}

function decisiveHeadToHeadWinner(
  results: readonly StageHeadToHeadResult[],
  participant1Key: string,
  participant2Key: string,
): string | null {
  const decisiveResults = results.filter(
    (result) =>
      pairMatches(result, participant1Key, participant2Key) &&
      result.status === "completed" &&
      (result.resultType === "played" || result.resultType === "walkover") &&
      (result.winnerKey === participant1Key || result.winnerKey === participant2Key),
  );
  return decisiveResults.length === 1 ? decisiveResults[0].winnerKey! : null;
}

export function rankRoundRobinOrGroup(
  entries: readonly RoundRobinStageRankingEntry[],
  headToHeadResults: readonly StageHeadToHeadResult[],
): StageRankingResult<RankedRoundRobinStageEntry> {
  const problems = validateStageSeeds(entries);
  if (problems.length > 0) return { valid: false, problems };

  const tiedCountByMatchWins = new Map<number, number>();
  for (const entry of entries) {
    tiedCountByMatchWins.set(entry.matchWins, (tiedCountByMatchWins.get(entry.matchWins) ?? 0) + 1);
  }

  const standings = entries.map<RankedRoundRobinStageEntry>((entry) => ({
    participantKey: entry.participantKey,
    matchWins: entry.matchWins,
    gameDiff: entry.gameDiff,
    gameWins: entry.gameWins,
    stageSeed: entry.stageSeed!,
    rank: 0,
  }));

  standings.sort((left, right) => {
    if (right.matchWins !== left.matchWins) return right.matchWins - left.matchWins;

    if ((tiedCountByMatchWins.get(left.matchWins) ?? 0) === 2) {
      const winner = decisiveHeadToHeadWinner(
        headToHeadResults,
        left.participantKey,
        right.participantKey,
      );
      if (winner === left.participantKey) return -1;
      if (winner === right.participantKey) return 1;
    }

    if (right.gameDiff !== left.gameDiff) return right.gameDiff - left.gameDiff;
    if (right.gameWins !== left.gameWins) return right.gameWins - left.gameWins;
    return left.stageSeed - right.stageSeed;
  });
  standings.forEach((standing, index) => {
    standing.rank = index + 1;
  });

  return { valid: true, standings };
}
