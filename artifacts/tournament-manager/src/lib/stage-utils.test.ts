import assert from "node:assert/strict";
import test from "node:test";
import type { Match } from "@workspace/api-client-react";
import { buildBracketFromMatches, deriveCurrentRound } from "./stage-utils";
import { filterMatchesForStage, STAGE_FORMAT_LABELS } from "./tournament-stages-ui";

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeMatch(
  id: number,
  round: number,
  matchNumber: number,
  stageId: number,
  status: Match["status"] = "pending",
): Match {
  return {
    id,
    tournamentId: 1,
    stageId,
    round,
    matchNumber,
    status,
    resultType: null,
    player1Id: null,
    player1Name: null,
    player2Id: null,
    player2Name: null,
    score1: null,
    score2: null,
    winnerId: null,
    bestOf: 1,
    stageGroupId: null,
  } as unknown as Match;
}

// ─── filterMatchesForStage ────────────────────────────────────────────────────

test("filterMatchesForStage: zwraca tylko mecze należące do podanego etapu", () => {
  const s1m1 = makeMatch(1, 1, 1, 10);
  const s1m2 = makeMatch(2, 1, 2, 10);
  const s2m1 = makeMatch(3, 1, 1, 20);

  const result = filterMatchesForStage([s1m1, s1m2, s2m1], 10);
  assert.equal(result.length, 2);
  assert.equal(result[0].id, 1);
  assert.equal(result[1].id, 2);
});

test("filterMatchesForStage: zwraca pustą tablicę gdy brak dopasowania", () => {
  const m = makeMatch(1, 1, 1, 99);
  assert.deepEqual(filterMatchesForStage([m], 42), []);
});

test("filterMatchesForStage: nie modyfikuje oryginalnej tablicy", () => {
  const matches = [makeMatch(1, 1, 1, 1), makeMatch(2, 1, 1, 2)];
  const original = matches.slice();
  filterMatchesForStage(matches, 1);
  assert.deepEqual(matches, original);
});

test("filterMatchesForStage: stageId jest wymagany przez typ Match (kompilacja z TS)", () => {
  type IsRequired = {} extends Pick<Match, "stageId"> ? false : true;
  const check: IsRequired = true;
  void check;
});

// ─── buildBracketFromMatches ──────────────────────────────────────────────────

test("buildBracketFromMatches: grupuje mecze po rundach w kolejności rosnącej", () => {
  const matches = [
    makeMatch(3, 2, 1, 1),
    makeMatch(1, 1, 1, 1),
    makeMatch(2, 1, 2, 1),
  ];
  const bracket = buildBracketFromMatches(matches);
  assert.equal(bracket.rounds.length, 2);
  assert.equal(bracket.rounds[0].round, 1);
  assert.equal(bracket.rounds[1].round, 2);
});

test("buildBracketFromMatches: sortuje mecze w rundzie według matchNumber", () => {
  const matches = [
    makeMatch(4, 1, 4, 1),
    makeMatch(2, 1, 2, 1),
    makeMatch(1, 1, 1, 1),
    makeMatch(3, 1, 3, 1),
  ];
  const { rounds } = buildBracketFromMatches(matches);
  const numbers = rounds[0].matches.map((m) => m.matchNumber);
  assert.deepEqual(numbers, [1, 2, 3, 4]);
});

test("buildBracketFromMatches: zwraca pustą listę rund dla braku meczów", () => {
  const bracket = buildBracketFromMatches([]);
  assert.deepEqual(bracket.rounds, []);
});

test("buildBracketFromMatches: jedna runda z jednym meczem", () => {
  const m = makeMatch(1, 1, 1, 5);
  const bracket = buildBracketFromMatches([m]);
  assert.equal(bracket.rounds.length, 1);
  assert.equal(bracket.rounds[0].round, 1);
  assert.equal(bracket.rounds[0].matches.length, 1);
});

// ─── deriveCurrentRound ───────────────────────────────────────────────────────

test("deriveCurrentRound: zwraca rundę meczu in_progress", () => {
  const matches = [
    makeMatch(1, 1, 1, 1, "completed"),
    makeMatch(2, 2, 1, 1, "in_progress"),
    makeMatch(3, 3, 1, 1, "pending"),
  ];
  assert.equal(deriveCurrentRound(matches), 2);
});

test("deriveCurrentRound: brak in_progress — zwraca najwyższą ukończoną rundę", () => {
  const matches = [
    makeMatch(1, 1, 1, 1, "completed"),
    makeMatch(2, 2, 1, 1, "completed"),
    makeMatch(3, 3, 1, 1, "pending"),
  ];
  assert.equal(deriveCurrentRound(matches), 2);
});

test("deriveCurrentRound: wszystkie pending — zwraca null", () => {
  const matches = [makeMatch(1, 1, 1, 1, "pending")];
  assert.equal(deriveCurrentRound(matches), null);
});

test("deriveCurrentRound: pusta lista — zwraca null", () => {
  assert.equal(deriveCurrentRound([]), null);
});

// ─── format → etykiety (STAGE_FORMAT_LABELS) ─────────────────────────────────

test("STAGE_FORMAT_LABELS: pokrywa wszystkie formaty etapów", () => {
  const formats = [
    "single_elimination",
    "swiss",
    "round_robin",
    "group_stage",
  ] as const;
  for (const format of formats) {
    assert.ok(
      STAGE_FORMAT_LABELS[format],
      `Brak etykiety dla formatu: ${format}`,
    );
  }
});
