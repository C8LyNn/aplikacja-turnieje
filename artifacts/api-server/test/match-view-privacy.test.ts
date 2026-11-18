import assert from "node:assert/strict";
import { test } from "node:test";
import {
  matchAudienceOf,
  ORGANIZER_ONLY_MATCH_FIELDS,
  PUBLIC_MATCH_FIELDS,
  toMatchView,
  type MatchRow,
} from "../src/application/matches/match-view";

const row = (extra: Record<string, unknown> = {}): MatchRow => ({
  id: 7, revision: 3, tournamentId: 2, stageId: 4, stageGroupId: null, round: 1, matchNumber: 2,
  player1Id: 10, player2Id: 11, score1: 2, score2: 1, winnerId: 10, bestOf: 3,
  resultType: "played", resultReason: null, note: "Prywatne: zawodnik spóźni się, tel. 600 000 000",
  status: "completed", nextMatchId: 9, sortOrder: null,
  scheduledAt: new Date("2026-11-20T18:00:00Z"), completedAt: new Date("2026-11-20T19:00:00Z"),
  routingMatchKey: null, setScores: null, ...extra,
} as MatchRow);

test("V5.10 P0: a public match is built from the explicit field list — no note, nothing from new columns", () => {
  const view = toMatchView(row({ futureSecretColumn: "x", organizerToken: "abc" }), { player1Name: "A", player2Name: "B" }, "public");
  assert.deepEqual(Object.keys(view).sort(), [...PUBLIC_MATCH_FIELDS].sort());
  assert.equal("note" in view, false);
  assert.equal(JSON.stringify(view).includes("Prywatne"), false);
  assert.equal(JSON.stringify(view).includes("abc"), false);
  assert.equal(view.scheduledAt, "2026-11-20T18:00:00.000Z");
  assert.equal(view.sets, null);
});

test("V5.10 P0: the organizer (and support) audience also gets the note; nothing else is added", () => {
  const view = toMatchView(row({ futureSecretColumn: "x" }), {}, "organizer");
  assert.deepEqual(Object.keys(view).sort(), [...PUBLIC_MATCH_FIELDS, ...ORGANIZER_ONLY_MATCH_FIELDS].sort());
  assert.equal(view.note, "Prywatne: zawodnik spóźni się, tel. 600 000 000");
  assert.equal(matchAudienceOf({ type: "organizer" }), "organizer");
  assert.equal(matchAudienceOf({ type: "support" }), "organizer");
  for (const type of ["viewer", "anonymous", "public"]) assert.equal(matchAudienceOf({ type }), "public");
  assert.equal(matchAudienceOf(undefined), "public");
  assert.equal(matchAudienceOf(null), "public");
});
