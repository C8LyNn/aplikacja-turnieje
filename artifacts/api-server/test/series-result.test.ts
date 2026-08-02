import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  validatePlayedSeriesResult,
  type PlayedSeriesResultInput,
  type SeriesResultErrorCode,
  type WinningSide,
} from "../src/domain/match/series-result";

interface ValidCase {
  bestOf: number;
  score1: number;
  score2: number;
  winnerSide: WinningSide;
}

const validCases: ValidCase[] = [
  { bestOf: 1, score1: 1, score2: 0, winnerSide: "player1" },
  { bestOf: 1, score1: 0, score2: 1, winnerSide: "player2" },
  { bestOf: 3, score1: 2, score2: 0, winnerSide: "player1" },
  { bestOf: 3, score1: 2, score2: 1, winnerSide: "player1" },
  { bestOf: 3, score1: 0, score2: 2, winnerSide: "player2" },
  { bestOf: 3, score1: 1, score2: 2, winnerSide: "player2" },
  { bestOf: 5, score1: 3, score2: 0, winnerSide: "player1" },
  { bestOf: 5, score1: 3, score2: 1, winnerSide: "player1" },
  { bestOf: 5, score1: 3, score2: 2, winnerSide: "player1" },
  { bestOf: 5, score1: 0, score2: 3, winnerSide: "player2" },
  { bestOf: 5, score1: 1, score2: 3, winnerSide: "player2" },
  { bestOf: 5, score1: 2, score2: 3, winnerSide: "player2" },
  { bestOf: 7, score1: 4, score2: 0, winnerSide: "player1" },
  { bestOf: 7, score1: 4, score2: 1, winnerSide: "player1" },
  { bestOf: 7, score1: 4, score2: 2, winnerSide: "player1" },
  { bestOf: 7, score1: 4, score2: 3, winnerSide: "player1" },
  { bestOf: 7, score1: 0, score2: 4, winnerSide: "player2" },
  { bestOf: 7, score1: 1, score2: 4, winnerSide: "player2" },
  { bestOf: 7, score1: 2, score2: 4, winnerSide: "player2" },
  { bestOf: 7, score1: 3, score2: 4, winnerSide: "player2" },
];

const expectedWinsRequired: Record<number, number> = {
  1: 1,
  3: 2,
  5: 3,
  7: 4,
};

interface InvalidCase {
  name: string;
  input: PlayedSeriesResultInput;
  code: SeriesResultErrorCode;
}

const invalidCases: InvalidCase[] = [
  { name: "BO3 1:0", input: { bestOf: 3, score1: 1, score2: 0 }, code: "WIN_THRESHOLD_NOT_REACHED" },
  { name: "BO5 2:1", input: { bestOf: 5, score1: 2, score2: 1 }, code: "WIN_THRESHOLD_NOT_REACHED" },
  { name: "BO3 3:0", input: { bestOf: 3, score1: 3, score2: 0 }, code: "SCORE_EXCEEDS_WIN_THRESHOLD" },
  { name: "BO3 2:2", input: { bestOf: 3, score1: 2, score2: 2 }, code: "BOTH_SIDES_REACHED_WIN_THRESHOLD" },
  { name: "BO3 1:1", input: { bestOf: 3, score1: 1, score2: 1 }, code: "WIN_THRESHOLD_NOT_REACHED" },
  { name: "BO3 0:0", input: { bestOf: 3, score1: 0, score2: 0 }, code: "WIN_THRESHOLD_NOT_REACHED" },
  { name: "negative score", input: { bestOf: 3, score1: -1, score2: 2 }, code: "SCORE_NEGATIVE" },
  { name: "fractional score", input: { bestOf: 3, score1: 2, score2: 0.5 }, code: "SCORE_NOT_INTEGER" },
  { name: "bestOf zero", input: { bestOf: 0, score1: 1, score2: 0 }, code: "BEST_OF_NOT_POSITIVE" },
  { name: "negative bestOf", input: { bestOf: -3, score1: 1, score2: 0 }, code: "BEST_OF_NOT_POSITIVE" },
  { name: "fractional bestOf", input: { bestOf: 2.5, score1: 2, score2: 0 }, code: "BEST_OF_NOT_INTEGER" },
  { name: "even bestOf", input: { bestOf: 4, score1: 3, score2: 0 }, code: "BEST_OF_NOT_ODD" },
  { name: "both sides exceed threshold", input: { bestOf: 3, score1: 3, score2: 3 }, code: "BOTH_SIDES_REACHED_WIN_THRESHOLD" },
];

describe("validatePlayedSeriesResult", () => {
  for (const testCase of validCases) {
    test(`accepts BO${testCase.bestOf} ${testCase.score1}:${testCase.score2}`, () => {
      const { winnerSide, ...input } = testCase;
      const result = validatePlayedSeriesResult(input);
      assert.equal(result.ok, true);
      if (!result.ok) return;
      assert.deepEqual(result.value, {
        resultType: "played",
        ...input,
        winnerSide,
        winsRequired: expectedWinsRequired[testCase.bestOf],
      });
    });
  }

  for (const testCase of invalidCases) {
    test(`rejects ${testCase.name}`, () => {
      const result = validatePlayedSeriesResult(testCase.input);
      assert.equal(result.ok, false);
      if (result.ok) return;
      assert.equal(result.error.code, testCase.code);
      assert.equal(typeof result.error.message, "string");
      assert.ok(result.error.message.length > 0);
    });
  }
});
