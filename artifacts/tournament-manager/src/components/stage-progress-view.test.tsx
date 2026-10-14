import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { DoubleEliminationStageState } from "@workspace/api-client-react";
import { StageProgressView } from "./stage-progress-view";

const previousFetch = globalThis.fetch;
const clients = new Set<QueryClient>();

afterEach(() => {
  cleanup();
  for (const client of clients) client.clear();
  clients.clear();
  globalThis.fetch = previousFetch;
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const stage = (id: number, format: string, status: string) => ({
  id, tournamentId: 9001, stageKey: "stage-" + id, name: id === 20 ? "RR History" : "Finał DE",
  position: id === 20 ? 1 : 2, format, status, participantCount: 2, bestOf: 1,
  currentRound: 1, totalRounds: 2, winnerId: null,
});

const graph = (): DoubleEliminationStageState => ({
  tournamentId: 9001, stageId: 21, revision: 4, completed: false, championParticipantKey: null,
  participants: [
    { participantKey: "a", playerId: 201, name: "DE Alpha", seed: 1, losses: 0, status: "active" },
    { participantKey: "b", playerId: 202, name: "DE Bravo", seed: 2, losses: 1, status: "active" },
  ],
  matches: [
    { matchKey: "u1", matchId: 101, name: "Upper 1", bracket: "upper", round: 1, matchNumber: 1, order: 0, slots: ["a", "b"], status: "completed", bestOf: 1, score1: 1, score2: 0, downstreamResultCount: 0, winnerParticipantKey: "a", loserParticipantKey: "b" },
    { matchKey: "l1", matchId: null, name: "Lower 1", bracket: "lower", round: 1, matchNumber: 1, order: 1, slots: ["b", null], status: "blocked", bestOf: null, score1: null, score2: null, downstreamResultCount: 0, winnerParticipantKey: null, loserParticipantKey: null },
    { matchKey: "gf", matchId: null, name: "Grand Final", bracket: "grand_final", round: 1, matchNumber: 1, order: 2, slots: ["a", null], status: "blocked", bestOf: null, score1: null, score2: null, downstreamResultCount: 0, winnerParticipantKey: null, loserParticipantKey: null },
    { matchKey: "gfr", matchId: null, name: "Grand Final Reset", bracket: "grand_final_reset", round: 1, matchNumber: 1, order: 3, slots: [null, null], status: "blocked", bestOf: null, score1: null, score2: null, downstreamResultCount: 0, winnerParticipantKey: null, loserParticipantKey: null },
  ],
});

function mount(fetcher: typeof fetch, activeStageId = 21) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  clients.add(client);
  globalThis.fetch = fetcher;
  render(
    <QueryClientProvider client={client}>
      <StageProgressView tournamentId={9001} activeStageId={activeStageId} matches={[]} />
    </QueryClientProvider>,
  );
  return client;
}

test("T100 RT-01: Details reads the selected canonical DE graph read-only, including Reset", async () => {
  const requested: string[] = [];
  mount(async input => {
    const path = String(input);
    requested.push(path);
    if (path.endsWith("/stages")) return json([stage(20, "round_robin", "completed"), stage(21, "double_elimination", "active")]);
    if (path.endsWith("/stages/21")) return json({ stage: stage(21, "double_elimination", "active"), groups: [], participants: [], ranking: [], qualifiers: [] });
    if (path.endsWith("/stages/21/double-elimination")) return json(graph());
    return json({ error: "Unmocked", path }, 404);
  });
  await screen.findByText("Upper Bracket");
  assert.ok(screen.getByText("Lower Bracket"));
  assert.ok(screen.getAllByText("Grand Final").length >= 1);
  assert.ok(screen.getAllByText("Grand Final Reset").length >= 1);
  assert.ok(screen.getByText("Rewizja 4"));
  assert.ok(requested.some(path => path.endsWith("/stages/21/double-elimination")));
  assert.ok(!requested.some(path => path.endsWith("/stages/20/double-elimination")));
  assert.equal(screen.queryByRole("button", { name: /Zapisz wynik|Cofnij \/ skoryguj wynik|Resetuj etap/ }), null);
  assert.equal(screen.queryByRole("spinbutton", { name: /Wynik/ }), null);
});

for (const failureStatus of [403, 500]) {
  test("T100 RT-03: DE error " + failureStatus + " is visible and manual retry restores the graph", async () => {
    let attempts = 0;
    mount(async input => {
      const path = String(input);
      if (path.endsWith("/stages")) return json([stage(21, "double_elimination", "active")]);
      if (path.endsWith("/stages/21")) return json({ stage: stage(21, "double_elimination", "active"), groups: [], participants: [], ranking: [], qualifiers: [] });
      if (path.endsWith("/stages/21/double-elimination")) {
        attempts += 1;
        return attempts === 1 ? json({ code: "TEST_FAILURE" }, failureStatus) : json(graph());
      }
      return json({}, 404);
    });
    await screen.findByRole("alert");
    assert.equal(screen.queryByText("Upper Bracket"), null);
    fireEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
    await screen.findByText("Upper Bracket");
    assert.equal(attempts, 2);
  });
}

test("T100 RT-02: a late old-stage detail cannot replace the selected DE graph", async () => {
  let releaseHistory: ((response: Response) => void) | undefined;
  const history = new Promise<Response>(resolve => { releaseHistory = resolve; });
  const requested: string[] = [];
  mount(async input => {
    const path = String(input);
    requested.push(path);
    if (path.endsWith("/stages")) return json([stage(20, "round_robin", "completed"), stage(21, "double_elimination", "active")]);
    if (path.endsWith("/stages/20")) return history;
    if (path.endsWith("/stages/21")) return json({ stage: stage(21, "double_elimination", "active"), groups: [], participants: [], ranking: [], qualifiers: [] });
    if (path.endsWith("/stages/21/double-elimination")) return json(graph());
    return json({}, 404);
  }, 20);
  fireEvent.click(await screen.findByRole("button", { name: /Finał DE/ }));
  await screen.findByText("Upper Bracket");
  await act(async () => {
    releaseHistory?.(json({
      stage: stage(20, "round_robin", "completed"), groups: [],
      participants: [{ id: 1, playerId: 999, playerName: "Historyczny RR Gracz", stageSeed: 1, finalRank: 1, status: "winner" }],
      ranking: [], qualifiers: [],
    }));
    await history;
  });
  await waitFor(() => assert.ok(screen.getByText("Upper Bracket")));
  assert.equal(screen.queryByText("Historyczny RR Gracz"), null);
  assert.ok(requested.some(path => path.endsWith("/stages/21/double-elimination")));
});
