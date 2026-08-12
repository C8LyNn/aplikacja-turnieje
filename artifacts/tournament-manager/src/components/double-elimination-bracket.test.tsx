import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import type { DoubleEliminationStageState } from "@workspace/api-client-react";
import { DoubleEliminationBracket } from "./double-elimination-bracket";

afterEach(cleanup);

const state: DoubleEliminationStageState = {
  tournamentId: 1,
  stageId: 2,
  revision: 4,
  completed: false,
  championParticipantKey: null,
  participants: [
    { participantKey: "p1", playerId: 11, name: "Alpha", seed: 1, losses: 0, status: "active" },
    { participantKey: "p2", playerId: 12, name: "Bravo", seed: 2, losses: 1, status: "active" },
  ],
  matches: [
    { matchKey: "u1", matchId: 101, name: "Upper 1", bracket: "upper", round: 1, matchNumber: 1, order: 0, slots: ["p1", "p2"], status: "completed", bestOf: 3, score1: 2, score2: 0, downstreamResultCount: 0, winnerParticipantKey: "p1", loserParticipantKey: "p2" },
    { matchKey: "l1", matchId: null, name: "Lower 1", bracket: "lower", round: 1, matchNumber: 1, order: 1, slots: ["p2", null], status: "blocked", bestOf: null, score1: null, score2: null, downstreamResultCount: 0, winnerParticipantKey: null, loserParticipantKey: null },
    { matchKey: "gf", matchId: null, name: "Grand Final", bracket: "grand_final", round: 1, matchNumber: 1, order: 2, slots: [null, null], status: "blocked", bestOf: null, score1: null, score2: null, downstreamResultCount: 0, winnerParticipantKey: null, loserParticipantKey: null },
    { matchKey: "gfr", matchId: null, name: "Grand Final Reset", bracket: "grand_final_reset", round: 1, matchNumber: 1, order: 3, slots: [null, null], status: "blocked", bestOf: null, score1: null, score2: null, downstreamResultCount: 0, winnerParticipantKey: null, loserParticipantKey: null },
  ],
};

test("renders all Double Elimination brackets read-only for viewers", () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <DoubleEliminationBracket tournamentId={1} stageId={2} state={state} />
    </QueryClientProvider>,
  );

  assert.ok(screen.getByText("Upper Bracket"));
  assert.ok(screen.getByText("Lower Bracket"));
  assert.ok(screen.getAllByText("Grand Final").length >= 1);
  assert.ok(screen.getAllByText("Grand Final Reset").length >= 1);
  assert.equal(screen.queryByRole("button", { name: /Resetuj etap/ }), null);
  assert.equal(screen.queryByRole("button", { name: /Ustaw|Wygrywa/ }), null);
  queryClient.clear();
});
