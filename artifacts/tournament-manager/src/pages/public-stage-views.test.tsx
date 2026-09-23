import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import TournamentBracket from "./tournament-bracket";
import TournamentProjector from "./tournament-projector";
import TournamentAudience from "./tournament-audience";
import type { DoubleEliminationStageState } from "@workspace/api-client-react";

const originalFetch = globalThis.fetch;
const clients = new Set<QueryClient>();
afterEach(() => { cleanup(); clients.forEach(client => client.clear()); clients.clear(); globalThis.fetch = originalFetch; window.localStorage.clear(); window.sessionStorage.clear(); });

const stage = (id: number, status: string, format = "single_elimination") => ({ id, tournamentId: 1, position: id, name: id === 1 ? "Eliminacje" : "Finał szkoleniowy", format, status, currentRound: 1, totalRounds: 1, participantCount: 2, bestOf: 1, winnerId: null as number | null });
const match = (stageId: number) => ({ id: stageId, tournamentId: 1, stageId, round: 1, matchNumber: 1, status: "completed", resultType: "played", bestOf: 1, player1Id: stageId * 10, player2Id: stageId * 10 + 1, player1Name: `Etap${stageId} Alpha`, player2Name: `Etap${stageId} Bravo`, score1: 1, score2: 0, winnerId: stageId * 10 });
const views = { bracket: TournamentBracket, projector: TournamentProjector, audience: TournamentAudience };
function mount(view: keyof typeof views, initialStages = [stage(1, "completed", "round_robin"), stage(2, "active")]) {
  const state = { stages: initialStages, tournament: { id: 1, name: "QA public stages", format: "round_robin", status: "active", activeStageId: 2, currentRound: 1, totalRounds: 1, visibility: "public_online" }, matches: [match(1), match(2)] };
  const requested: string[] = [];
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } } });
  clients.add(client);
  globalThis.fetch = async input => {
    const url = String(input);
    requested.push(url);
    const deId = url.match(/\/stages\/(\d+)\/double-elimination$/)?.[1];
    const body = deId ? deState(Number(deId)) : url.endsWith("/stages") ? state.stages : url.endsWith("/bracket") ? { tournament: state.tournament, rounds: [{ round: 1, matches: state.matches }] } : url.endsWith("/matches") ? state.matches : url.endsWith("/tournaments/1") ? state.tournament : [];
    return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
  };
  const location = memoryLocation({ path: `/tournaments/1/${view}${view === "audience" ? "?section=bracket" : ""}` });
  const View = views[view];
  render(<QueryClientProvider client={client}><Router hook={location.hook} searchHook={location.searchHook}><AuthProvider><View /></AuthProvider></Router></QueryClientProvider>);
  return { state, client, requested };
}

function deState(stageId: number): DoubleEliminationStageState {
  return { tournamentId: 1, stageId, revision: 1, completed: false, championParticipantKey: null,
    participants: [ { participantKey: "a", playerId: 10, name: `DE${stageId} Alpha`, seed: 1, losses: 0, status: "active" }, { participantKey: "b", playerId: 11, name: `DE${stageId} Bravo`, seed: 2, losses: 1, status: "active" } ],
    matches: [
      { matchKey: "u1", matchId: 101, name: "Upper 1", bracket: "upper", round: 1, matchNumber: 1, order: 0, slots: ["a", "b"], status: "completed", bestOf: 1, score1: 1, score2: 0, downstreamResultCount: 0, winnerParticipantKey: "a", loserParticipantKey: "b" },
      { matchKey: "l1", matchId: null, name: "Lower 1", bracket: "lower", round: 1, matchNumber: 1, order: 1, slots: ["b", null], status: "blocked", bestOf: null, score1: null, score2: null, downstreamResultCount: 0, winnerParticipantKey: null, loserParticipantKey: null },
      { matchKey: "gf", matchId: null, name: "Grand Final", bracket: "grand_final", round: 1, matchNumber: 1, order: 2, slots: ["a", null], status: "blocked", bestOf: null, score1: null, score2: null, downstreamResultCount: 0, winnerParticipantKey: null, loserParticipantKey: null },
    ],
  };
}
async function refresh(client: QueryClient, suffix?: string) {
  await act(async () => { await client.refetchQueries({ predicate: query => !suffix || String(query.queryKey[0]).endsWith(suffix) }); });
}

test("public bracket keeps readable scale across refetch and fit never magnifies a small bracket", async () => {
  const { state, client } = mount("bracket");
  await screen.findAllByText("Etap2 Alpha");
  assert.equal(screen.getByTitle("Dopasuj do ekranu").textContent, "100%");
  const canvas = screen.getByLabelText("Drabinka eliminacyjna").parentElement!.parentElement!;
  for (const width of [1920, 1366, 1024]) {
    Object.defineProperties(canvas, { clientWidth: { configurable: true, value: width }, clientHeight: { configurable: true, value: 700 } });
    fireEvent.click(screen.getByTitle("Dopasuj do ekranu (Fit)"));
    assert.equal(screen.getByTitle("Dopasuj do ekranu").textContent, "100%");
  }
  fireEvent.click(screen.getByTitle("Przybliżenie (+)"));
  assert.equal(screen.getByTitle("Dopasuj do ekranu").textContent, "110%");
  state.matches[1].score1 = 2;
  await refresh(client, "/bracket");
  assert.equal(screen.getByTitle("Dopasuj do ekranu").textContent, "110%", "polling must not reset manual zoom or fit against content height");
});

for (const view of Object.keys(views) as (keyof typeof views)[]) {
  test(`${view}: completed RR history is excluded from the active final`, async () => {
    mount(view);
    await screen.findAllByText("Etap2 Alpha");
    assert.ok(!screen.queryByText("Etap1 Alpha"), "Historical Stage 1 match leaked into the current bracket");
    assert.ok(screen.getByText(/Finał szkoleniowy/));
  });
  test(`${view}: transition follows refreshed stages even before tournament metadata catches up`, async () => {
    const { state, client } = mount(view, [stage(2, "planned"), stage(1, "active", "round_robin")]);
    state.tournament.activeStageId = 1;
    await screen.findAllByText("Etap1 Alpha");
    assert.ok(!screen.queryByText("Etap2 Alpha"));
    state.stages = [stage(1, "completed", "round_robin"), stage(2, "active")];
    await refresh(client, "/stages");
    await screen.findAllByText("Etap2 Alpha");
    assert.ok(!screen.queryByText("Etap1 Alpha"));
    state.tournament.activeStageId = 2;
    await refresh(client);
    await waitFor(() => assert.ok(screen.getByText(/Finał szkoleniowy/)));
    assert.ok(!screen.queryByText("Etap1 Alpha"));
  });
  test(`${view}: only planned stages do not expose preloaded matches`, async () => {
    mount(view, [stage(1, "planned"), stage(2, "planned")]);
    await screen.findAllByText(/Brak rozpoczętego etapu/);
    assert.ok(!screen.queryByText("Etap1 Alpha") && !screen.queryByText("Etap2 Alpha"));
  });
  test(`${view}: completed stages choose the final by position, not response order`, async () => {
    mount(view, [{ ...stage(2, "completed"), winnerId: 20 }, stage(1, "completed", "round_robin")]);
    await screen.findAllByText("Etap2 Alpha");
    assert.ok(!screen.queryByText("Etap1 Alpha"));
    await screen.findByText(/Zwycięzca/i);
  });
  test(`${view}: single-stage elimination still renders its own matches`, async () => {
    mount(view, [stage(1, "active")]);
    await screen.findAllByText("Etap1 Alpha");
    assert.ok(!screen.queryByText("Etap2 Alpha"));
  });
  test(`${view}: active DE uses its own endpoint and preserves upper/lower/final structure`, async () => {
    const { requested } = mount(view, [stage(1, "completed", "double_elimination"), stage(2, "active", "double_elimination")]);
    await screen.findAllByText(/DE2 Alpha/);
    assert.ok(!screen.queryByText(/DE1 Alpha/));
    assert.ok(requested.some(url => url.endsWith("/stages/2/double-elimination")));
    assert.ok(!requested.some(url => url.endsWith("/stages/1/double-elimination")));
    await screen.findAllByText(/Upper Bracket/);
    await screen.findAllByText(/Lower Bracket/);
    await screen.findAllByText(/Grand Final/);
  });
  test(`${view}: leaving DE removes its cached canvas when the next elimination stage starts`, async () => {
    const { state, client } = mount(view, [stage(1, "active", "double_elimination"), stage(2, "planned")]);
    state.tournament.activeStageId = 1;
    await screen.findAllByText(/DE1 Alpha/);
    state.stages = [stage(1, "completed", "double_elimination"), stage(2, "active")];
    await refresh(client, "/stages");
    await screen.findAllByText("Etap2 Alpha");
    assert.ok(!screen.queryByText(/DE1 Alpha/));
  });
}
