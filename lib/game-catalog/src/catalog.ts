import {
  isPlainObject,
  TournamentGameConfigError,
  type GameDefinition,
  type TournamentGameConfigEnvelope,
} from "./core";
import {
  DEADLOCK_GAME_DEFINITION,
  type DeadlockTournamentConfigV1,
} from "./deadlock";
import {
  MARVEL_GAME_DEFINITION,
  type MarvelTournamentConfigV1,
} from "./marvel";

export type SupportedTournamentGameConfig =
  | (TournamentGameConfigEnvelope<DeadlockTournamentConfigV1> & {
      gameId: "deadlock";
      configVersion: 1;
    })
  | (TournamentGameConfigEnvelope<MarvelTournamentConfigV1> & {
      gameId: "marvel";
      configVersion: 1;
    });

const GAME_DEFINITIONS: ReadonlyMap<string, GameDefinition<object>> = new Map([
  [
    DEADLOCK_GAME_DEFINITION.id,
    DEADLOCK_GAME_DEFINITION as GameDefinition<object>,
  ],
  [MARVEL_GAME_DEFINITION.id, MARVEL_GAME_DEFINITION as GameDefinition<object>],
]);

export function getGameDefinition(gameId: string): GameDefinition<object> | undefined {
  return GAME_DEFINITIONS.get(gameId);
}

export function parseTournamentGameConfig(
  value: unknown,
): SupportedTournamentGameConfig {
  if (!isPlainObject(value)) {
    throw new TournamentGameConfigError(
      "INVALID_GAME_CONFIG",
      "Tournament game config must be an object.",
    );
  }
  const unknownKeys = Object.keys(value).filter(
    (key) => key !== "gameId" && key !== "configVersion" && key !== "config",
  );
  if (unknownKeys.length > 0) {
    throw new TournamentGameConfigError(
      "INVALID_GAME_CONFIG",
      `Unknown tournament game config field: ${unknownKeys[0]}.`,
    );
  }
  if (typeof value.gameId !== "string") {
    throw new TournamentGameConfigError("INVALID_GAME_CONFIG", "gameId is required.");
  }
  const definition = getGameDefinition(value.gameId);
  if (!definition) {
    throw new TournamentGameConfigError(
      "UNKNOWN_GAME_ID",
      `Unknown game: ${value.gameId}.`,
    );
  }
  if (!Number.isSafeInteger(value.configVersion) || Number(value.configVersion) < 1) {
    throw new TournamentGameConfigError(
      "INVALID_GAME_CONFIG",
      "configVersion must be a positive integer.",
    );
  }
  const configVersion = Number(value.configVersion);
  const config = definition.parseTournamentConfig(configVersion, value.config);
  return {
    gameId: definition.id,
    configVersion,
    config,
  } as SupportedTournamentGameConfig;
}
