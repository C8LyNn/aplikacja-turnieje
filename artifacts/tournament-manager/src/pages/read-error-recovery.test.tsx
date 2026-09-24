import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import { setOrganizerToken } from "@/lib/auth";
import { SecurityPanel } from "@/components/security-panel";
import { StageBasketsPanel } from "@/components/stage-baskets-panel";
import TournamentDetail from "./tournament-detail";
import TournamentAudience from "./tournament-audience";
import TournamentBracket from "./tournament-bracket";
import TournamentProjector from "./tournament-projector";

const originalFetch = globalThis.fetch;
const clients = new Set<QueryClient>();
afterEach(() => {
  cleanup();
  clients.forEach(client => client.clear());
  clients.clear();
  globalThis.fetch = originalFetch;
  localStorage.clear();
  sessionStorage.clear();
});

const tournament = { id: 1, name: "Turniej odczytu", status: "active", format: "round_robin", visibility: "public_online", activeStageId: 1, currentRound: 1, totalRounds: 1, defaultBestOf: 3, hasOrganizerPassword: true };
const stages = [{ id: 1, tournamentId: 1, stageKey: "s1", position: 1, name: "Etap odczytu", status: "active", format: "single_elimination", currentRound: 1, totalRounds: 1, participantCount: 2, bestOf: 3 }];
const players = [{ id: 1, tournamentId: 1, name: "Kontrolny Alfa", seed: 1, status: "active" }, { id: 2, tournamentId: 1, name: "Kontrolny Beta", seed: 2, status: "active" }];
const matches = [{ id: 1, revision: 1, tournamentId: 1, stageId: 1, round: 1, matchNumber: 1, status: "pending", bestOf: 3, player1Id: 1, player2Id: 2, player1Name: players[0].name, player2Name: players[1].name, score1: null, score2: null, winnerId: null }];
const standings = players.map((player, i) => ({ playerId: player.id, playerName: player.name, rank: i + 1, points: 0, wins: 0, losses: 0, draws: 0, matchWins: 0, matchLosses: 0, matchesPlayed: 0, status: "active" }));
const basketConfig = { tournamentId: 1, flowAuthority: "legacy", legacyDefaulted: true, baskets: [], routes: [], validation: { valid: true, problems: [] } };
type View = "players" | "matches" | "standings" | "audience-players" | "audience-bracket" | "live" | "bracket" | "projector" | "baskets" | "security" | "security-log";

function mount(view: View, target: string, initialMode: "pending" | "error" | "data" = "pending") {
  let finishRequest!: () => void;
  const gate = new Promise<void>(resolve => { finishRequest = resolve; });
  const server = { mode: initialMode as "pending" | "error" | "data" | "empty", targetRequests: 0, writes: 0, status: 500 };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  clients.add(client);
  localStorage.setItem("tm_role", "organizer");
  setOrganizerToken(1, "read-test-token");
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (init?.method && init.method !== "GET") server.writes++;
    const endpoint = url.replace(/^.*\/api\/tournaments\/1/, "") || "/tournament";
    if (endpoint === target) {
      server.targetRequests++;
      if (server.mode === "pending") await gate;
      if (server.mode === "error") return new Response(JSON.stringify({ error: "read failed", code: "READ_ERROR" }), { status: server.status, headers: { "content-type": "application/json" } });
    }
    const bodies: Record<string, unknown> = {
      "/tournament": tournament, "/players": players, "/matches": view === "live" ? matches.map(match => ({ ...match, status: "in_progress" })) : matches, "/standings": standings, "/stages": stages,
      "/bracket": { tournament, rounds: [{ round: 1, matches }] }, "/stage-baskets": basketConfig,
      "/auth/support-sessions": [{ id: 1, nick: "Operator odczytu", createdAt: "2026-09-01T10:00:00Z", lastActiveAt: "2026-09-01T10:00:00Z" }],
      "/audit-log": [{ id: 1, actorType: "organizer", actorNick: "Operator odczytu", action: "Zapis kontrolny", createdAt: "2026-09-01T10:00:00Z" }],
    };
    const body = endpoint === target && server.mode === "empty" ? [] : bodies[endpoint] ?? [];
    return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
  };
  const location = memoryLocation({ path: view === "players" ? "/tournaments/1?tab=players"
    : view === "bracket" || view === "projector" ? `/tournaments/1/${view}`
    : `/tournaments/1/audience?section=${view.replace("audience-", "")}` });
  const content = view === "players" ? <TournamentDetail /> : view === "bracket" ? <TournamentBracket />
    : view === "projector" ? <TournamentProjector /> : view === "baskets" ? <StageBasketsPanel tournamentId={1} tournamentStatus="draft" orgToken="read-test-token" />
    : view.startsWith("security") ? <SecurityPanel tournamentId={1} hasOrganizerPassword /> : <TournamentAudience />;
  render(<QueryClientProvider client={client}><Router hook={location.hook} searchHook={location.searchHook}><AuthProvider>{content}</AuthProvider></Router></QueryClientProvider>);
  if (view === "security-log") fireEvent.click(screen.getByRole("button", { name: /Logi działań/ }));
  const refresh = async () => {
    if (view.startsWith("security")) {
      fireEvent.click(screen.getByTitle("Odśwież"));
    } else {
      await act(async () => { await client.refetchQueries({ predicate: query => String(query.queryKey[0]).endsWith(target === "/tournament" ? "/tournaments/1" : target) }); });
    }
  };
  return { server, client, finishRequest, refresh };
}

const listCases: { view: View; target: string; empty: RegExp; data: string }[] = [
  { view: "players", target: "/players", empty: /Brak graczy/, data: "Kontrolny Alfa" },
  { view: "matches", target: "/matches", empty: /Brak meczów do wyświetlenia/, data: "Kontrolny Alfa" },
  { view: "standings", target: "/standings", empty: /Tabela nie jest jeszcze dostępna/, data: "Kontrolny Alfa" },
  { view: "audience-players", target: "/players", empty: /Nie dodano jeszcze uczestników/, data: "Kontrolny Alfa" },
  { view: "security", target: "/auth/support-sessions", empty: /Brak aktywnych sesji wsparcia/, data: "Operator odczytu" },
  { view: "security-log", target: "/audit-log", empty: /Brak logów działań/, data: "Zapis kontrolny" },
  { view: "live", target: "/matches", empty: /^Przerwa$/, data: "Kontrolny Alfa" },
];

for (const scenario of listCases) {
  test(`${scenario.view}: loading, read error, retry, successful empty and data are distinct`, async () => {
    const { server, finishRequest, refresh } = mount(scenario.view, scenario.target);
    await waitFor(() => assert.ok(server.targetRequests > 0), { timeout: 3000 });
    assert.ok(!screen.queryByText(scenario.empty), "pending must not look empty");
    await waitFor(() => assert.ok(screen.getAllByRole("status").some(node => /Ładowanie|Pobieranie/.test(node.textContent ?? ""))));
    server.mode = "error";
    await act(async () => { finishRequest(); });
    const alert = await screen.findByRole("alert");
    assert.match(alert.textContent ?? "", /Nie udało się pobrać/);
    assert.ok(!screen.queryByText(scenario.empty));
    server.mode = "empty";
    fireEvent.click(within(alert).getByRole("button", { name: "Spróbuj ponownie" }));
    await screen.findByText(scenario.empty);
    assert.ok(!screen.queryByRole("alert"));
    server.mode = "data";
    await refresh();
    await screen.findAllByText(scenario.data);
    assert.ok(!screen.queryByText(scenario.empty));
    assert.equal(server.writes, 0, "retry must never invoke a mutation");
  });

  test(`${scenario.view}: background error retains data, retry recovers`, async () => {
    const { server, refresh } = mount(scenario.view, scenario.target, "data");
    await screen.findAllByText(scenario.data, {}, { timeout: 3000 });
    server.mode = "error";
    await refresh();
    const alert = await screen.findByRole("alert");
    assert.ok(screen.getAllByText(scenario.data).length);
    assert.ok(!screen.queryByText(scenario.empty));
    server.mode = "data";
    fireEvent.click(within(alert).getByRole("button", { name: "Spróbuj ponownie" }));
    await waitFor(() => assert.ok(!screen.queryByRole("alert")));
    assert.ok(screen.getAllByText(scenario.data).length);
    assert.equal(server.writes, 0);
  });
}

for (const view of ["bracket", "projector", "audience-bracket"] as const) for (const target of ["/tournament", "/stages", "/bracket"]) {
  test(`${view} ${target}: initial failure stops loading; retry and background recovery preserve bracket`, async () => {
    const { server, finishRequest, refresh } = mount(view, target);
    await waitFor(() => assert.ok(server.targetRequests > 0));
    assert.ok(screen.getAllByRole("status").length);
    server.mode = "error";
    await act(async () => { finishRequest(); });
    let alert = await screen.findByRole("alert");
    assert.ok(!screen.queryByRole("status"), "settled error cannot keep a loading status");
    server.mode = "data";
    fireEvent.click(within(alert).getByRole("button", { name: "Spróbuj ponownie" }));
    await screen.findAllByText("Kontrolny Alfa");
    server.mode = "error";
    await refresh();
    alert = await screen.findByRole("alert");
    assert.ok(screen.getAllByText("Kontrolny Alfa").length);
    server.mode = "data";
    fireEvent.click(within(alert).getByRole("button", { name: "Spróbuj ponownie" }));
    await waitFor(() => assert.ok(!screen.queryByRole("alert")));
    assert.ok(screen.getAllByText("Kontrolny Alfa").length);
    assert.equal(server.writes, 0);
  });
}

test("baskets: read failure offers retry without rendering an empty configuration", async () => {
  const { server, finishRequest } = mount("baskets", "/stage-baskets");
  await waitFor(() => assert.ok(server.targetRequests > 0));
  assert.ok(screen.getByRole("status"));
  assert.ok(!screen.queryByTestId("enter-advanced-btn"));
  server.mode = "error";
  await act(async () => { finishRequest(); });
  const alert = await screen.findByRole("alert");
  server.mode = "data";
  fireEvent.click(within(alert).getByRole("button", { name: "Spróbuj ponownie" }));
  await screen.findByTestId("enter-advanced-btn");
  assert.equal(server.writes, 0);
});

for (const target of ["/stages", "/players"]) test(`baskets: ${target} failure is not an empty map or roster`, async () => {
  const { server } = mount("baskets", target, "error");
  const alert = await screen.findByRole("alert");
  assert.ok(!screen.queryByText(/Brak etapów/));
  assert.ok(!screen.queryByTestId("enter-advanced-btn"));
  server.mode = "data";
  fireEvent.click(within(alert).getByRole("button", { name: "Spróbuj ponownie" }));
  await screen.findByTestId("stage-block-1");
  assert.equal(server.writes, 0);
});

for (const view of ["bracket", "projector", "audience-bracket"] as const) test(`${view}: 404 has a completed error state, not loading or a private tournament gate`, async () => {
  const { server, finishRequest } = mount(view, "/tournament");
  server.mode = "error";
  server.status = 404;
  finishRequest();
  const alert = await screen.findByRole("alert");
  assert.match(alert.textContent ?? "", /Nie znaleziono turnieju/);
  assert.ok(!screen.queryByRole("status"));
  assert.ok(!screen.queryByText("Turniej prywatny"));
});

test("public matches: pending background refresh keeps rows and does not announce every poll", async () => {
  const { server, client, finishRequest } = mount("matches", "/matches", "data");
  await screen.findByText("Kontrolny Alfa");
  server.mode = "pending";
  // Do not await the deliberately held request before checking the existing rows.
  let completion!: Promise<void>;
  act(() => { completion = client.refetchQueries({ predicate: query => String(query.queryKey[0]).endsWith("/matches") }); });
  await waitFor(() => assert.ok(screen.getByText("Odświeżanie danych…")));
  assert.ok(screen.getByText("Kontrolny Alfa"));
  assert.ok(!screen.queryByRole("status"));
  server.mode = "data";
  await act(async () => { finishRequest(); await completion; });
  await waitFor(() => assert.ok(!screen.queryByText("Odświeżanie danych…")));
});

test("baskets: background failure and retry preserve the changed draft", async () => {
  const { server, refresh } = mount("baskets", "/stage-baskets", "data");
  fireEvent.click(await screen.findByTestId("enter-advanced-btn"));
  fireEvent.click(screen.getByRole("button", { name: /Dodaj.*wejściowy/i }));
  const draft = screen.getByTestId("stage-block-1").textContent;
  server.mode = "error";
  await refresh();
  const alert = await screen.findByRole("alert");
  assert.ok(screen.getByTestId("save-baskets-btn"));
  assert.equal(screen.getByTestId("stage-block-1").textContent, draft);
  server.mode = "data";
  fireEvent.click(within(alert).getByRole("button", { name: "Spróbuj ponownie" }));
  await waitFor(() => assert.ok(!screen.queryByRole("alert")));
  assert.equal(screen.getByTestId("stage-block-1").textContent, draft);
  assert.ok(screen.getByTestId("save-baskets-btn"));
  assert.equal(server.writes, 0);
});
