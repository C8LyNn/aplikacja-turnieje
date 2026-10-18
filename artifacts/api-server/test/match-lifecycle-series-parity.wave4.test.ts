/**
 * WEB-005 T040 A70 / DEVELOPMENT FIRST WAVE 4.
 * DB-free regression of the shared played-result validator used by both
 * CompleteMatch and RevertMatch. DOES NOT assert transactional Undo or CAS.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { validatePlayedSeriesResult } from "../src/domain/match/series-result";

function reject(
  bestOf: number,
  score1: number,
  score2: number,
  code: string,
): void {
  const value = validatePlayedSeriesResult({ bestOf, score1, score2 });
  assert.equal(value.ok, false, "BO"+bestOf+" "+score1+":"+score2+" must be invalid");
  if (value.ok) throw new Error("Invalid result was accepted.");
  assert.equal(value.error.code, code);
}

test("W4-S01 valid terminal scores have exactly one derived winner across BO1–63", () => {
  let verified = 0;
  for (let bestOf = 1; bestOf <= 63; bestOf += 2) {
    const winsRequired = (bestOf + 1) / 2;
    for (let loserScore = 0; loserScore < winsRequired; loserScore++) {
      for (const winner of ["player1", "player2"] as const) {
        const score1 = winner === "player1" ? winsRequired : loserScore;
        const score2 = winner === "player2" ? winsRequired : loserScore;
        const result = validatePlayedSeriesResult({ bestOf, score1, score2 });
        assert.equal(result.ok, true, "BO"+bestOf+" "+score1+":"+score2);
        if (!result.ok) throw new Error("Unexpected result validation rejection.");
        assert.equal(result.value.winnerSide, winner);
        assert.equal(result.value.winsRequired, winsRequired);
        assert.equal(result.value.resultType, "played");
        assert.equal(result.value.score1, score1);
        assert.equal(result.value.score2, score2);
        verified++;
      }
    }
  }
  assert.equal(verified, 1056);
});

test("W4-S02 a partial or tied series cannot be completed before either side wins", () => {
  let checked = 0;
  for (let bestOf = 1; bestOf <= 63; bestOf += 2) {
    const threshold = (bestOf + 1) / 2;
    for (let i = 0; i < threshold; i++) {
      reject(bestOf, i, i, "WIN_THRESHOLD_NOT_REACHED");
      checked++;
    }
    if (threshold > 1) {
      reject(bestOf, threshold - 1, 0, "WIN_THRESHOLD_NOT_REACHED");
      reject(bestOf, 0, threshold - 1, "WIN_THRESHOLD_NOT_REACHED");
      checked += 2;
    }
  }
  assert.equal(checked, 590);
});

test("W4-S03 ambiguous and overlong stored results are refused symmetrically", () => {
  for (let bestOf = 1; bestOf <= 63; bestOf += 2) {
    const target = (bestOf + 1) / 2;
    reject(bestOf, target, target, "BOTH_SIDES_REACHED_WIN_THRESHOLD");
    reject(bestOf, target + 1, target, "BOTH_SIDES_REACHED_WIN_THRESHOLD");
    reject(bestOf, target, target + 1, "BOTH_SIDES_REACHED_WIN_THRESHOLD");
    reject(bestOf, target + 1, 0, "SCORE_EXCEEDS_WIN_THRESHOLD");
    reject(bestOf, 0, target + 1, "SCORE_EXCEEDS_WIN_THRESHOLD");
  }
});

test("W4-S04 non-integer, negative, and nonfinite values fail closed", () => {
  reject(0, 0, 0, "BEST_OF_NOT_POSITIVE");
  reject(-3, 0, 0, "BEST_OF_NOT_POSITIVE");
  reject(2, 1, 0, "BEST_OF_NOT_ODD");
  reject(2.5, 1, 0, "BEST_OF_NOT_INTEGER");
  reject(Number.NaN, 1, 0, "BEST_OF_NOT_INTEGER");
  reject(Number.POSITIVE_INFINITY, 1, 0, "BEST_OF_NOT_INTEGER");
  reject(3, -1, 2, "SCORE_NEGATIVE");
  reject(3, 2, -1, "SCORE_NEGATIVE");
  reject(3, Number.NaN, 0, "SCORE_NOT_INTEGER");
  reject(3, 2, Number.POSITIVE_INFINITY, "SCORE_NOT_INTEGER");
  reject(3, Number.NEGATIVE_INFINITY, 2, "SCORE_NOT_INTEGER");
  reject(3, 2.5, 0, "SCORE_NOT_INTEGER");
});

test("W4-S05 repeated validation cannot mutate frozen match-score input", () => {
  const source = Object.freeze({ resultType: "played" as const, bestOf: 7, score1: 4, score2: 2 });
  const first = validatePlayedSeriesResult(source);
  const second = validatePlayedSeriesResult(source);
  assert.equal(first.ok, true);
  assert.deepEqual(second, first);
  assert.deepEqual(source, { resultType: "played", bestOf: 7, score1: 4, score2: 2 });
  if (first.ok && second.ok) {
    assert.notStrictEqual(first.value, second.value);
  }
  // These are repeated pure validations. There is no action log, Undo, HTTP or DB here.
});

test("W4-S06 maximal PostgreSQL int32 bestOf is numerically stable", () => {
  const bestOf = 2_147_483_647;
  const winsRequired = 1_073_741_824;
  const result = validatePlayedSeriesResult({
    bestOf, score1: winsRequired, score2: winsRequired - 1,
  });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("Expected valid large odd BO result");
  assert.equal(result.value.winnerSide, "player1");
  assert.equal(result.value.winsRequired, winsRequired);
  reject(bestOf, winsRequired + 1, 0, "SCORE_EXCEEDS_WIN_THRESHOLD");
});
