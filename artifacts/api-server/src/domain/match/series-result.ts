export type MatchResultType = "played" | "walkover" | "bye" | "no_contest";

export type WinningSide = "player1" | "player2";

export interface PlayedSeriesResultInput {
  resultType?: "played";
  bestOf: number;
  score1: number;
  score2: number;
}

export interface NonPlayedSeriesResultInput {
  resultType: Exclude<MatchResultType, "played">;
}

export type SeriesResultInput = PlayedSeriesResultInput | NonPlayedSeriesResultInput;

export interface NormalizedPlayedSeriesResult {
  resultType: "played";
  bestOf: number;
  score1: number;
  score2: number;
  winsRequired: number;
  winnerSide: WinningSide;
}

export type SeriesResultErrorCode =
  | "BEST_OF_NOT_INTEGER"
  | "BEST_OF_NOT_POSITIVE"
  | "BEST_OF_NOT_ODD"
  | "SCORE_NOT_INTEGER"
  | "SCORE_NEGATIVE"
  | "SCORE_EXCEEDS_WIN_THRESHOLD"
  | "WIN_THRESHOLD_NOT_REACHED"
  | "BOTH_SIDES_REACHED_WIN_THRESHOLD";

export interface SeriesResultDomainError {
  code: SeriesResultErrorCode;
  message: string;
}

export type PlayedSeriesValidationResult =
  | { ok: true; value: NormalizedPlayedSeriesResult }
  | { ok: false; error: SeriesResultDomainError };

function failure(code: SeriesResultErrorCode, message: string): PlayedSeriesValidationResult {
  return { ok: false, error: { code, message } };
}

/**
 * Validates `series_v1` semantics and derives the winner from the series score.
 */
export function validatePlayedSeriesResult(
  input: PlayedSeriesResultInput,
): PlayedSeriesValidationResult {
  if (!Number.isInteger(input.bestOf)) {
    return failure("BEST_OF_NOT_INTEGER", "bestOf must be an integer.");
  }
  if (input.bestOf <= 0) {
    return failure("BEST_OF_NOT_POSITIVE", "bestOf must be greater than zero.");
  }
  if (input.bestOf % 2 === 0) {
    return failure("BEST_OF_NOT_ODD", "bestOf must be odd.");
  }
  if (!Number.isInteger(input.score1) || !Number.isInteger(input.score2)) {
    return failure("SCORE_NOT_INTEGER", "Series scores must be integers.");
  }
  if (input.score1 < 0 || input.score2 < 0) {
    return failure("SCORE_NEGATIVE", "Series scores cannot be negative.");
  }

  const winsRequired = Math.floor(input.bestOf / 2) + 1;
  if (input.score1 >= winsRequired && input.score2 >= winsRequired) {
    return failure(
      "BOTH_SIDES_REACHED_WIN_THRESHOLD",
      "Exactly one side must reach the series win threshold.",
    );
  }
  if (input.score1 > winsRequired || input.score2 > winsRequired) {
    return failure(
      "SCORE_EXCEEDS_WIN_THRESHOLD",
      "A series score cannot exceed the number of wins required.",
    );
  }

  const player1ReachedThreshold = input.score1 === winsRequired;
  const player2ReachedThreshold = input.score2 === winsRequired;
  if (!player1ReachedThreshold && !player2ReachedThreshold) {
    return failure(
      "WIN_THRESHOLD_NOT_REACHED",
      "One side must reach the series win threshold.",
    );
  }
  const scoreWinner: WinningSide = player1ReachedThreshold ? "player1" : "player2";

  return {
    ok: true,
    value: {
      resultType: "played",
      bestOf: input.bestOf,
      score1: input.score1,
      score2: input.score2,
      winsRequired,
      winnerSide: scoreWinner,
    },
  };
}
