/** V5.8 · viewer: find a participant, follow their path, open a shared link to one match. */
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import TournamentAudience from "./tournament-audience";

const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; window.localStorage.clear(); window.sessionStorage.clear(); });

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const tournament = {
  id: 1, name: "Puchar", format: "single_elimination", status: "active", resultModelVersion: "series_v1", rankingPolicy: "match_record_v1",
  defaultBestOf: 1, hasHostCode: false, hasOrganizerPassword: false, hasSupportPassword: false, visibility: "public_online",
  activeStageId: null, currentRound: 1, totalRounds: 2, featuredMatchId: null, createdAt: "2026-01-01T00:00:00.000Z",
};
const players = [
  { id: 1, tournamentId: 1, name: "Łucja", seed: 1, status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: 2, tournamentId: 1, name: "Bartek", seed: 2, status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: 3, tournamentId: 1, name: "Celina", seed: 3, status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
];
const matches = [
  { id: 41, tournamentId: 1, round: 1, matchNumber: 1, bestOf: 1, status: "completed", resultType: "played", score1: 1, score2: 0, winnerId: 1, player1Id: 1, player2Id: 2, player1Name: "Łucja", player2Name: "Bartek", revision: 2 },
  { id: 42, tournamentId: 1, round: 2, matchNumber: 1, bestOf: 1, status: "pending", resultType: null, score1: null, score2: null, winnerId: null, player1Id: 1, player2Id: 3, player1Name: "Łucja", player2Name: "Celina", revision: 1 },
];

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, refetchInterval: false }, mutations: { retry: false, gcTime: 0 } } });
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/tournaments/1")) return json(tournament);
    if (url.endsWith("/players")) return json(players);
    if (url.endsWith("/matches")) return json(matches);
    if (url.endsWith("/bracket")) return json({ rounds: [], winner: null });
    return json([]);
  }) as typeof fetch;
  const location = memoryLocation({ path, record: true });
  render(
    <QueryClientProvider client={client}>
      <Router hook={location.hook} searchHook={location.searchHook}>
        <AuthProvider><TournamentAudience /></AuthProvider>
      </Router>
    </QueryClientProvider>,
  );
  return location;
}

test("participants: search ignores Polish letters and each card shows the participant's path with match links", async () => {
  renderAt("/tournaments/1/audience?section=players");
  // The viewer loads its data in phases; the participant list comes last.
  const search = await screen.findByRole("searchbox", {}, { timeout: 10000 });
  fireEvent.change(search, { target: { value: "lucja" } });
  await waitFor(() => assert.match(screen.getByRole("status").textContent ?? "", /Znaleziono: 1/));
  assert.equal(screen.queryByRole("heading", { name: "Bartek" }), null);
  const card = screen.getByRole("heading", { name: "Łucja" }).closest("article")!;
  const path = within(card).getByText(/Droga w turnieju · 2 mecze/).closest("details")!;
  assert.match(path.textContent ?? "", /R1 · vs Bartek/);
  assert.match(path.textContent ?? "", /wygrana 1:0/);
  const link = within(path).getByRole("link", { name: "wygrana 1:0" });
  assert.match(link.getAttribute("href") ?? "", /audience\?section=matches&mecz=41/);
});

test("a shared match link marks that match in the matches view", async () => {
  renderAt("/tournaments/1/audience?section=matches&mecz=42");
  await waitFor(() => assert.ok(document.getElementById("mecz-42")));
  assert.equal(document.getElementById("mecz-42")!.getAttribute("data-highlight"), "true");
  assert.equal(document.getElementById("mecz-41")!.getAttribute("data-highlight"), null);
  assert.ok(screen.getByRole("link", { name: "Link do meczu: Łucja – Celina" }));
});
