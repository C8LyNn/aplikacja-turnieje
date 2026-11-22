import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";
import type { DoubleEliminationMatch, DoubleEliminationParticipant } from "@workspace/api-client-react";
import { DEBracketCanvas } from "./de-bracket-canvas";

afterEach(cleanup);

function match(bracket: DoubleEliminationMatch["bracket"], round: number, n: number, name: string,
  status: DoubleEliminationMatch["status"], slots: Array<string | null>, winner: string | null = null): DoubleEliminationMatch {
  return {
    matchKey: `${bracket}-r${round}-m${n}`, matchId: null, name, bracket, round, matchNumber: n, order: 0,
    slots, status, bestOf: 3, score1: null, score2: null, downstreamResultCount: 0,
    winnerParticipantKey: winner, loserParticipantKey: null,
  } as DoubleEliminationMatch;
}

/** 4 entrants, all played; the Upper winner took the Grand Final, so the reset resolves as a BYE. */
function finishedFour(resetStatus: DoubleEliminationMatch["status"]): DoubleEliminationMatch[] {
  return [
    match("upper", 1, 1, "Upper R1 M1", "completed", ["a", "d"], "a"),
    match("upper", 1, 2, "Upper R1 M2", "completed", ["b", "c"], "b"),
    match("upper", 2, 1, "Upper R2 M1", "completed", ["a", "b"], "a"),
    match("lower", 1, 1, "Lower R1 M1", "completed", ["d", "c"], "c"),
    match("lower", 2, 1, "Lower R2 M1", "completed", ["c", "b"], "b"),
    match("grand_final", 1, 1, "Grand Final", "completed", ["a", "b"], "a"),
    match("grand_final_reset", 1, 1, "Grand Final Reset", resetStatus, ["a", null], "a"),
  ];
}
const participants = new Map<string, DoubleEliminationParticipant>(
  ["a", "b", "c", "d"].map((key, i) => [key, { participantKey: key, playerId: i + 1, name: `Gracz ${key}`, seed: i + 1, losses: 0, status: "active" } as DoubleEliminationParticipant]),
);

test("a reset the engine resolved as BYE (Upper winner took the Grand Final) reads 'not required', not 'wolny los'", () => {
  const view = render(<DEBracketCanvas matches={finishedFour("bye")} participants={participants} />);
  assert.ok(view.getByText("Reset nie jest wymagany"));
  assert.equal(view.queryAllByText("wolny los").length, 0);
});

test("a played reset is shown as a normal match card", () => {
  const view = render(<DEBracketCanvas matches={finishedFour("completed")} participants={participants} />);
  assert.equal(view.queryAllByText("Reset nie jest wymagany").length, 0);
});
