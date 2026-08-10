export type GameId = string;

export interface TournamentGameConfigEnvelope<TConfig extends object = Record<string, unknown>> {
  gameId: GameId;
  configVersion: number;
  config: TConfig;
}

export interface GameDefinition<TConfig extends object> {
  readonly id: GameId;
  readonly displayName: string;
  readonly currentConfigVersion: number;
  parseTournamentConfig(configVersion: number, config: unknown): TConfig;
}

export type TournamentGameConfigProblemCode =
  | "UNKNOWN_GAME_ID"
  | "UNSUPPORTED_GAME_CONFIG_VERSION"
  | "INVALID_GAME_CONFIG";

export class TournamentGameConfigError extends Error {
  constructor(
    public readonly code: TournamentGameConfigProblemCode,
    message: string,
  ) {
    super(message);
    this.name = "TournamentGameConfigError";
  }
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
