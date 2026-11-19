// QW-05 · viewer pages: the private bracket no longer hangs on "Ładowanie turnieju…", the DE draft no longer asks
// for a bracket that cannot exist yet, and the public summary shows NOW → NEXT → RECENT from real statuses only.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import { shouldRetryRead } from "@/components/private-tournament-gate";
import TournamentBracket from "./tournament-bracket";
import TournamentAudience from "./tournament-audience";

const originalFetch = globalThis.fetch;
const clients = new Set<QueryClient>();
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear()); clients.clear();
  globalThis.fetch = originalFetch;
  window.localStorage.clear(); window.sessionStorage.clear();
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
type Call = { path: string; headers: Record<string, string> };

function install(routes: (path: string) => Response | undefined): Call[] {
  const calls: Call[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, "http://localhost");
    const headers: Record<string, string> = {};
    new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)).forEach((value, key) => { headers[key] = value; });
    calls.push({ path: url.pathname, headers });
    return routes(url.pathname) ?? json([]);
  }) as typeof fetch;
  return calls;
}

function mount(path: string, Page: () => React.ReactElement) {
  // The app's own retry policy (App.tsx), so the test sees what a viewer sees.
  const client = new QueryClient({ defaultOptions: { queries: { retry: shouldRetryRead, retryDelay: 1, gcTime: 0 } } });
  clients.add(client);
  const location = memoryLocation({ path });
  render(<QueryClientProvider client={client}><Router hook={location.hook}><AuthProvider><Page /></AuthProvider></Router></QueryClientProvider>);
}

const tournament = (over: Record<string, unknown> = {}) => ({
  id: 1, name: "Puchar QW-05", format: "single_elimination", status: "active", visibility: "public_online",
  resultModelVersion: "series_v1", defaultBestOf: 1, activeStageId: 11, currentRound: 1, totalRounds: 3, featuredMatchId: null,
  hasOrganizerPassword: true, createdAt: "2026-11-19T00:00:00.000Z", ...over,
});
const stage = (over: Record<string, unknown> = {}) => ({
  id: 11, tournamentId: 1, stageKey: "s1", position: 1, name: "Drabinka główna", status: "active", format: "single_elimination",
  currentRound: 1, totalRounds: 3, participantCount: 8, bestOf: 1, ...over,
});
const m = (id: number, over: Record<string, unknown> = {}) => ({
  id, revision: 1, tournamentId: 1, stageId: 11, round: 1, matchNumber: id, status: "pending", bestOf: 1,
  player1Id: id * 10, player2Id: id * 10 + 1, player1Name: `Gracz ${id}A`, player2Name: `Gracz ${id}B`, score1: null, score2: null, ...over,
});

test("QW-05: a private bracket shows the viewer-password gate at once — one request, no retries, no endless loading", async () => {
  const calls = install((path) => path === "/api/tournaments/1" ? json({ code: "VIEWER_PASSWORD_REQUIRED", error: "x" }, 403) : undefined);
  window.localStorage.setItem("tm_role", "fan");
  mount("/tournaments/1/bracket", TournamentBracket);
  assert.ok(await screen.findByRole("heading", { name: "Turniej prywatny" }));
  assert.ok(screen.getByRole("button", { name: "Podaj hasło widza" }));
  assert.equal(screen.queryByText("Ładowanie turnieju…"), null);
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(calls.filter((call) => call.path === "/api/tournaments/1").length, 1, "a refusal is not retried");
});

test("QW-05: the bracket page sends the session's organizer token, so the organizer opens a private bracket", async () => {
  window.localStorage.setItem("tm_role", "organizer");
  window.sessionStorage.setItem("tm_org_1", "organizer-token-qw05");
  const calls = install((path) => {
    if (path === "/api/tournaments/1") return json(tournament({ visibility: "private_offline" }));
    if (path.endsWith("/stages")) return json([stage()]);
    if (path.endsWith("/bracket")) return json({ rounds: [], winner: null });
    return undefined;
  });
  mount("/tournaments/1/bracket", TournamentBracket);
  assert.ok(await screen.findByText("Puchar QW-05"));
  const first = calls.find((call) => call.path === "/api/tournaments/1")!;
  assert.equal(first.headers["x-organizer-token"], "organizer-token-qw05", "the very first read carries the credentials");
  assert.equal(screen.queryByRole("heading", { name: "Turniej prywatny" }), null);
});

test("QW-05: a draft Double Elimination audience never asks for the bracket and says the tournament has not started", async () => {
  const calls = install((path) => {
    if (path === "/api/tournaments/1") return json(tournament({ status: "draft", format: "double_elimination", activeStageId: null, currentRound: null, totalRounds: null }));
    if (path.endsWith("/stages")) return json([stage({ format: "double_elimination", status: "planned", currentRound: null, totalRounds: null })]);
    if (path.endsWith("/players")) return json([{ id: 1, tournamentId: 1, name: "Szkic 1", seed: 1, status: "active" }]);
    return undefined;
  });
  window.localStorage.setItem("tm_role", "fan");
  mount("/tournaments/1/audience", TournamentAudience);
  const now = await screen.findByRole("region", { name: "Teraz" });
  assert.ok(within(now).getByText("Jeszcze się nie rozpoczął"));
  assert.ok(await screen.findByRole("heading", { name: "Turniej jeszcze się nie rozpoczął" }));
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(calls.filter((call) => call.path.includes("/double-elimination")).length, 0);
  assert.equal(screen.queryByText(/wznowią się wkrótce/), null, "no invented promise");
});

test("QW-05: the public summary opens first and shows NOW (all live matches), NEXT and RECENT from real statuses", async () => {
  install((path) => {
    if (path === "/api/tournaments/1") return json(tournament({ featuredMatchId: null }));
    if (path.endsWith("/stages")) return json([stage()]);
    if (path.endsWith("/matches")) return json([
      m(1, { status: "completed", resultType: "played", score1: 1, score2: 0, winnerId: 10, completedAt: "2026-11-19T10:00:00Z" }),
      m(2, { status: "completed", resultType: "bye", winnerId: 20, player2Id: null, player2Name: null, completedAt: "2026-11-19T11:00:00Z" }),
      m(3, { status: "in_progress", score1: 1, score2: 1 }),
      m(4, { status: "in_progress", score1: 0, score2: 0 }),
      m(5),
      m(6, { player2Id: null, player2Name: null }),
    ]);
    if (path.endsWith("/bracket")) return json({ rounds: [], winner: null });
    return undefined;
  });
  window.localStorage.setItem("tm_role", "fan");
  mount("/tournaments/1/audience", TournamentAudience);
  const now = await screen.findByRole("region", { name: "Teraz" });
  assert.ok(within(now).getByText("W trakcie"));
  assert.ok(await within(now).findByText("2 mecze w toku"));
  assert.ok(within(now).getByText("1 z 5 meczów rozegranych"), "the bye is not counted as a match");
  assert.ok(within(now).getByText("Runda 1 z 3"));
  const alsoLive = await screen.findByRole("region", { name: "Także w toku" });
  assert.ok(within(alsoLive).getByText("Gracz 4A"), "the second live match is shown too");
  const next = screen.getByText("Następne mecze").closest("[data-exp-panel-title]") as HTMLElement;
  assert.ok(within(next).getByText("Gracz 5A"));
  assert.equal(within(next).queryByText("Gracz 6A"), null, "a match without both participants is not 'next'");
  const recent = screen.getByText("Ostatnie wyniki").closest("[data-exp-panel-title]") as HTMLElement;
  assert.ok(within(recent).getByText("Gracz 1A"));
  assert.equal(within(recent).queryByText("Gracz 2A"), null, "a bye is not a result");
  // 4. the full structure follows on the same page, after NOW → NEXT → RECENT
  const bracket = await screen.findByRole("region", { name: "Drabinka" });
  assert.ok(now.compareDocumentPosition(bracket) & Node.DOCUMENT_POSITION_FOLLOWING, "the bracket comes after the summary");
  await waitFor(() => assert.ok(within(now).getByText(/^Zaktualizowano \d{2}:\d{2}:\d{2}$/)));
});
