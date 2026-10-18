import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getGetTournamentStageQueryKey } from "@workspace/api-client-react";
import { StageProgressView } from "./stage-progress-view";

const originalFetch = globalThis.fetch;
const clients = new Set<QueryClient>();
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status, headers: { "content-type": "application/json" },
  });
const stage = (id: number, format: string, status: string) => ({
  id, tournamentId: 77, stageKey: "s" + id,
  name: id === 31 ? "Historyczny RR31" : "Aktualny DE32",
  position: id === 31 ? 1 : 2, format, status,
  participantCount: 1, bestOf: 1, currentRound: 1,
  totalRounds: 2, winnerId: null,
});
const history = (playerName: string) => ({
  stage: stage(31, "round_robin", "completed"),
  groups: [],
  participants: [{
    id: 71, playerId: 701, playerName, stageSeed: 1,
    finalRank: 1, groupRank: null, status: "winner",
  }],
  ranking: [], qualifiers: [],
});
const deDetails = {
  stage: stage(32, "double_elimination", "active"),
  groups: [], participants: [], ranking: [], qualifiers: [],
};

afterEach(() => {
  cleanup();
  for (const client of clients) client.clear();
  clients.clear();
  globalThis.fetch = originalFetch;
});

function mount(initialSelectedStageId: number, httpStatus: 401 | 403) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 60000 } },
  });
  clients.add(client);
  const rrKey = getGetTournamentStageQueryKey(77, 31);
  // Stage previously returned private data on an authorized 200.
  client.setQueryData(rrKey, history("RR_STALE_PRIVATE_RANK_701"));
  let authorizeRetry = false;
  let rrGets = 0;
  const requested: string[] = [];
  globalThis.fetch = async input => {
    const path = String(input);
    requested.push(path);
    if (path.endsWith("/stages")) return json([
      stage(31, "round_robin", "completed"),
      stage(32, "double_elimination", "active"),
    ]);
    if (path.endsWith("/stages/31")) {
      rrGets += 1;
      return authorizeRetry
        ? json(history("RR_CANONICAL_AFTER_RETRY_701"))
        : json({ code: "FORBIDDEN" }, httpStatus);
    }
    if (path.endsWith("/stages/32")) return json(deDetails);
    return json({ code: "NO_FIXTURE", path }, 404);
  };
  render(
    <QueryClientProvider client={client}>
      <StageProgressView tournamentId={77} activeStageId={initialSelectedStageId} matches={[]} />
    </QueryClientProvider>,
  );
  return {
    client, rrKey, requested, getRrCalls: () => rrGets,
    authorize: () => { authorizeRetry = true; },
  };
}

for (const status of [401, 403] as const) {
  test(`T100-R19-C01-${status}: manually selected RR31 denies cached private participant while DE32 stays navigable`, async () => {
    const h = mount(32, status);
    const de = await screen.findByRole("button", { name: /Aktualny DE32/ });
    assert.equal(de.getAttribute("aria-pressed"), "true");
    assert.equal(screen.queryByText("RR_STALE_PRIVATE_RANK_701"), null);

    fireEvent.click(screen.getByRole("button", { name: /Historyczny RR31/ }));
    await screen.findByRole("alert");
    assert.equal(screen.queryByText("RR_STALE_PRIVATE_RANK_701"), null,
      "cached authorized private RR row must never render during 401/403");
    assert.equal(screen.queryByRole("table", { name: /Klasyfikacja końcowa etapu/ }), null);
    assert.ok(screen.getByRole("button", { name: /Aktualny DE32/ }));
    assert.ok(h.getRrCalls() >= 1, "RR history URL was requested");

    fireEvent.click(screen.getByRole("button", { name: /Aktualny DE32/ }));
    await waitFor(() => assert.equal(
      screen.getByRole("button", { name: /Aktualny DE32/ }).getAttribute("aria-pressed"), "true"));
    assert.equal(screen.queryByRole("alert"), null,
      "old RR error must not prohibit the lawful DE selection");
    assert.equal(screen.queryByText("RR_STALE_PRIVATE_RANK_701"), null);

    // Switching back to denied history still must not display a stale row.
    fireEvent.click(screen.getByRole("button", { name: /Historyczny RR31/ }));
    await screen.findByRole("alert");
    assert.equal(screen.queryByText("RR_STALE_PRIVATE_RANK_701"), null);

    h.authorize();
    const beforeRetry = h.getRrCalls();
    fireEvent.click(screen.getByRole("button", { name: /Spróbuj ponownie/ }));
    await screen.findByText("RR_CANONICAL_AFTER_RETRY_701");
    assert.equal(screen.queryByRole("alert"), null);
    assert.equal(screen.queryByText("RR_STALE_PRIVATE_RANK_701"), null);
    assert.equal(h.getRrCalls(), beforeRetry + 1,
      "manual retry must issue exactly one selected-stage read, not all RR stages");
    assert.ok(h.requested.every(p => !p.endsWith("/stages/32/undo")));
  });
}

test("T100-R19-C02: preexisting 403 error and cached authorized rows are never visible on first selected RR render", async () => {
  const h = mount(32, 403);
  const rrKey = h.rrKey;
  await act(async () => {
    await assert.rejects(
      h.client.fetchQuery({
        queryKey: rrKey,
        queryFn: async () => { throw Object.assign(new Error("Forbidden"), { status: 403 }); },
        staleTime: 0, retry: false,
      }),
    );
  });
  assert.ok(h.client.getQueryData(rrKey), "fixture has private data plus failed status");
  fireEvent.click(await screen.findByRole("button", { name: /Historyczny RR31/ }));
  await screen.findByRole("alert");
  assert.equal(screen.queryByText("RR_STALE_PRIVATE_RANK_701"), null);
  assert.equal(screen.queryByRole("table", { name: /Klasyfikacja końcowa etapu/ }), null);
});
