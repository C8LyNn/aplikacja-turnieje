import {
  isPlainObject,
  TournamentGameConfigError,
  type GameDefinition,
} from "./core";

export const MARVEL_GAME_ID = "marvel" as const;
export const MARVEL_CONFIG_VERSION = 1 as const;

export const MARVEL_REGROUPING_STRATEGIES = [
  "paired_merge",
  "random",
  "manual",
] as const;

export type MarvelRegroupingStrategy =
  (typeof MARVEL_REGROUPING_STRATEGIES)[number];

export interface MarvelTournamentConfigV1 {
  groupSize: number;
  advancingCount: number;
  killLimit: number;
  regroupingStrategy: MarvelRegroupingStrategy;
}

export const DEFAULT_MARVEL_TOURNAMENT_CONFIG: MarvelTournamentConfigV1 = {
  groupSize: 8,
  advancingCount: 4,
  killLimit: 20,
  regroupingStrategy: "paired_merge",
};

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

export function calculateMarvelRoundParticipantCounts(
  initialParticipantCount: number,
  groupSize: number,
  advancingCount: number,
): number[] {
  if (
    !positiveInteger(initialParticipantCount) ||
    initialParticipantCount < 2
  ) {
    throw new RangeError("initialParticipantCount must be at least 2.");
  }
  if (!positiveInteger(groupSize) || groupSize < 2) {
    throw new RangeError("groupSize must be at least 2.");
  }
  if (!positiveInteger(advancingCount) || advancingCount >= groupSize) {
    throw new RangeError(
      "advancingCount must satisfy 1 <= advancingCount < groupSize.",
    );
  }
  const rounds = [initialParticipantCount];
  let participantCount = initialParticipantCount;
  while (participantCount > groupSize) {
    if (participantCount % groupSize !== 0) {
      throw new RangeError(
        `Round participant count ${participantCount} is not divisible by groupSize ${groupSize}.`,
      );
    }
    participantCount = (participantCount / groupSize) * advancingCount;
    rounds.push(participantCount);
  }
  return rounds;
}

export function parseMarvelTournamentConfig(
  configVersion: number,
  config: unknown,
): MarvelTournamentConfigV1 {
  if (configVersion !== MARVEL_CONFIG_VERSION) {
    throw new TournamentGameConfigError(
      "UNSUPPORTED_GAME_CONFIG_VERSION",
      `Unsupported Marvel tournament config version: ${configVersion}.`,
    );
  }
  if (!isPlainObject(config)) {
    throw new TournamentGameConfigError(
      "INVALID_GAME_CONFIG",
      "Marvel tournament config must be an object.",
    );
  }

  const allowedKeys = new Set([
    "groupSize",
    "advancingCount",
    "killLimit",
    "regroupingStrategy",
  ]);
  const unknownKey = Object.keys(config).find((key) => !allowedKeys.has(key));
  if (unknownKey) {
    throw new TournamentGameConfigError(
      "INVALID_GAME_CONFIG",
      `Unknown Marvel tournament config field: ${unknownKey}.`,
    );
  }

  const groupSize =
    config.groupSize ?? DEFAULT_MARVEL_TOURNAMENT_CONFIG.groupSize;
  const advancingCount =
    config.advancingCount ?? DEFAULT_MARVEL_TOURNAMENT_CONFIG.advancingCount;
  const killLimit =
    config.killLimit ?? DEFAULT_MARVEL_TOURNAMENT_CONFIG.killLimit;
  const regroupingStrategy =
    config.regroupingStrategy ??
    DEFAULT_MARVEL_TOURNAMENT_CONFIG.regroupingStrategy;

  if (!positiveInteger(groupSize) || groupSize < 2 || groupSize > 128) {
    throw new TournamentGameConfigError(
      "INVALID_GAME_CONFIG",
      "Marvel groupSize must be an integer between 2 and 128.",
    );
  }
  if (!positiveInteger(advancingCount) || advancingCount >= groupSize) {
    throw new TournamentGameConfigError(
      "INVALID_GAME_CONFIG",
      "Marvel advancingCount must satisfy 1 <= advancingCount < groupSize.",
    );
  }
  if (!positiveInteger(killLimit)) {
    throw new TournamentGameConfigError(
      "INVALID_GAME_CONFIG",
      "Marvel killLimit must be a positive integer.",
    );
  }
  if (
    typeof regroupingStrategy !== "string" ||
    !MARVEL_REGROUPING_STRATEGIES.includes(
      regroupingStrategy as MarvelRegroupingStrategy,
    )
  ) {
    throw new TournamentGameConfigError(
      "INVALID_GAME_CONFIG",
      `Marvel regroupingStrategy must be one of: ${MARVEL_REGROUPING_STRATEGIES.join(", ")}.`,
    );
  }

  return {
    groupSize,
    advancingCount,
    killLimit,
    regroupingStrategy: regroupingStrategy as MarvelRegroupingStrategy,
  };
}

export const MARVEL_GAME_DEFINITION: GameDefinition<MarvelTournamentConfigV1> =
  {
    id: MARVEL_GAME_ID,
    displayName: "Marvel — Eliminacyjne grupy",
    currentConfigVersion: MARVEL_CONFIG_VERSION,
    parseTournamentConfig: parseMarvelTournamentConfig,
  };
