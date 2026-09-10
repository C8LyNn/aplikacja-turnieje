import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import TournamentHost from "./tournament-host";

const originalFetch = globalThis.fetch;
const clients = new Set<QueryClient>();

afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.clear();
  globalThis.fetch = originalFetch;
  window.localStorage.clear();
  window.sessionStorage.clear();
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

test("host header shows the forced Deadlock hero", async () => {
  const tournament = {
    id: 1,
    name: "Deadlock Host Test",
    format: "single_elimination",
    status: "active",
    resultModelVersion: "series_v1",
    rankingPolicy: "match_record_v1",
    defaultBestOf: 3,
    hasHostCode: false,
    hasOrganizerPassword: true,
    hasSupportPassword: false,
    hasViewerPassword: false,
    visibility: "public_online",
    activeStageId: 1,
    currentRound: 1,
    totalRounds: 1,
    featuredMatchId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    gameConfig: {
      gameId: "deadlock",
      configVersion: 1,
      config: { forcedHeroId: "rem" },
    },
  };

  window.localStorage.setItem("tm_role", "organizer");
  window.sessionStorage.setItem("tm_org_1", "test-organizer-token");
  const requestedPaths: string[] = [];
  globalThis.fetch = async (input) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : (input as Request).url;
    const pathname = new URL(url, "http://localhost").pathname;
    requestedPaths.push(pathname);
    if (pathname === "/api/tournaments/1") return jsonResponse(tournament);
    if (pathname.endsWith("/bracket")) {
      return jsonResponse({ tournament, rounds: [], winner: null });
    }
    if (pathname.endsWith("/assistant")) {
      return jsonResponse({ stepTitle: "", nextAction: "" });
    }
    return jsonResponse([]);
  };

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, refetchInterval: false },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  const location = memoryLocation({ path: "/tournaments/1/host" });
  clients.add(queryClient);
  render(
    <QueryClientProvider client={queryClient}>
      <Router hook={location.hook}>
        <AuthProvider>
          <TournamentHost />
        </AuthProvider>
      </Router>
    </QueryClientProvider>,
  );

  await waitFor(() =>
    assert.match(
      document.body.textContent ?? "",
      /Rem/,
      `requested paths: ${requestedPaths.join(", ")}`,
    ),
  );
  const image = screen.getByAltText("Rem") as HTMLImageElement;
  assert.match(image.src, /game-assets\/deadlock\/heroes\/rem\.png$/);
  queryClient.clear();
});

function hostStage(id = 2, status = "active") {
  return { id, tournamentId: 1, position: id, name: id === 2 ? "Finały szkoleniowe" : "Eliminacje",
    format: "single_elimination", status, participantCount: 4, bestOf: 3, currentRound: 1, totalRounds: 2 };
}

function hostMatch(id: number, stageId = 2, status = "pending") {
  return { id, tournamentId: 1, stageId, round: 1, matchNumber: id, status, bestOf: 3,
    player1Id: id * 2, player2Id: id * 2 + 1, player1Name: `Gracz A${id}`, player2Name: `Gracz B${id}`,
    score1: 0, score2: 0, resultType: null, winnerId: null };
}

async function renderOperationalHost(options: {
  matches: ReturnType<typeof hostMatch>[];
  stages?: ReturnType<typeof hostStage>[];
  intercept?: (path: string, init?: RequestInit) => Promise<Response | undefined>;
}) {
  window.localStorage.setItem("tm_role", "organizer");
  window.sessionStorage.setItem("tm_org_1", "test-organizer-token");
  globalThis.fetch = async (input, init) => {
    const path = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, "http://localhost").pathname;
    const intercepted = await options.intercept?.(path, init);
    if (intercepted) return intercepted;
    if (path === "/api/tournaments/1") return jsonResponse({
      id: 1, name: "Turniej szkoleniowy", status: "active", format: "swiss", activeStageId: 2,
      currentRound: 5, totalRounds: 5, defaultBestOf: 3, featuredMatchId: 100,
      hasOrganizerPassword: true, resultModelVersion: "series_v1", visibility: "public_online",
    });
    if (path.endsWith("/stages")) return jsonResponse(options.stages ?? [hostStage(1, "completed"), hostStage()]);
    if (path.endsWith("/matches")) return jsonResponse(options.matches);
    if (path.endsWith("/assistant")) return jsonResponse({ stepTitle: "Wpisuj wyniki", nextAction: "Wybierz mecz" });
    if (path.endsWith("/bracket")) return jsonResponse({ rounds: [], winner: null });
    return jsonResponse([]);
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  clients.add(client);
  const location = memoryLocation({ path: "/tournaments/1/host" });
  render(<QueryClientProvider client={client}><Router hook={location.hook}><AuthProvider><TournamentHost /></AuthProvider></Router></QueryClientProvider>);
  return userEvent.setup();
}

test("Host does not mistake an initial network failure for missing organizer access", async () => {
  let failed = true;
  const user = await renderOperationalHost({ matches: [hostMatch(1)], intercept: async (path) =>
    path === "/api/tournaments/1" && failed ? new Response("unavailable", { status: 503 }) : undefined });
  await screen.findByRole("heading", { name: "Nie udało się pobrać turnieju" });
  assert.equal(screen.queryByRole("button", { name: "Zaloguj jako organizator" }) === null, true);
  failed = false;
  await user.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
  await screen.findByRole("button", { name: "Rozpocznij mecz" });
});

test("Host focuses the active stage and exposes the entire queue including live matches", async () => {
  const old = hostMatch(100, 1, "completed");
  const current = Array.from({ length: 10 }, (_, index) => hostMatch(index + 1, 2, index === 1 ? "in_progress" : "pending"));
  await renderOperationalHost({ matches: [old, ...current] });
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A2" });
  assert.match(screen.getByRole("region", { name: "Stan prowadzenia" }).textContent ?? "", /Finały szkoleniowe.*Runda 1\/2/);
  assert.equal(screen.queryByText("Gracz A100"), null);
  assert.ok(screen.getByRole("button", { name: /Gracz A10 vs Gracz B10/ }));
  assert.ok(screen.getByRole("button", { name: /Gracz A2 vs Gracz B2.*LIVE/ }));
  assert.equal(screen.queryByText("▶ aktywny"), null);
});

test("Host distinguishes a failed match load from an empty queue and can retry", async () => {
  let failed = true;
  const user = await renderOperationalHost({ matches: [hostMatch(1)], intercept: async (path) =>
    path.endsWith("/matches") && failed ? new Response("unavailable", { status: 503 }) : undefined });
  await screen.findByRole("alert");
  assert.match(screen.getByRole("alert").textContent ?? "", /Dane mogą być nieaktualne/);
  assert.equal(screen.queryByText(/Brak meczów gotowych/), null);
  assert.equal(screen.queryByRole("button", { name: "Rozpocznij mecz" }), null);
  failed = false;
  await user.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
  await screen.findByRole("button", { name: "Rozpocznij mecz" });
  assert.equal(screen.queryByRole("alert"), null);
});

test("Host blocks repeated actions while saving and keeps an operational error on failure", async () => {
  let writes = 0;
  let finish: (response: Response) => void = () => { throw new Error("No pending request"); };
  const user = await renderOperationalHost({ matches: [hostMatch(1)], intercept: async (path, init) => {
    if (path === "/api/matches/1" && init?.method === "PATCH") {
      writes++;
      return new Promise<Response>((resolve) => { finish = resolve; });
    }
    return undefined;
  } });
  const start = await screen.findByRole("button", { name: "Rozpocznij mecz" });
  await user.dblClick(start);
  await waitFor(() => assert.equal(writes, 1));
  assert.ok(start.matches(":disabled"));
  assert.match(document.body.textContent ?? "", /Zapisywanie i odświeżanie stanu/);
  finish(new Response(JSON.stringify({ code: "STAGE_NOT_ACTIVE", error: "Ten etap nie jest obecnie aktywny." }), { status: 422, headers: { "content-type": "application/json" } }));
  await screen.findByRole("alert");
  assert.match(screen.getByRole("alert").textContent ?? "", /Ten etap nie jest obecnie aktywny/);
  assert.match(screen.getByRole("alert").textContent ?? "", /Kod diagnostyczny: STAGE_NOT_ACTIVE/);
  await waitFor(() => assert.equal(start.matches(":disabled"), false));
});

test("Host waits for refreshed data after saving a score before enabling further actions", async () => {
  const matches = [hostMatch(1), hostMatch(2)];
  let saved = false;
  let writes = 0;
  let releaseRead: () => void = () => { throw new Error("No pending refresh"); };
  const readBarrier = new Promise<void>((resolve) => { releaseRead = resolve; });
  const user = await renderOperationalHost({ matches, intercept: async (path, init) => {
    if (path === "/api/matches/1/complete") {
      writes++;
      assert.deepEqual(JSON.parse(String(init?.body)), { resultType: "played", score1: 2, score2: 0 });
      matches[0] = { ...matches[0], status: "completed", score1: 2 };
      saved = true;
      return jsonResponse(matches[0]);
    }
    if (path.endsWith("/matches") && saved) {
      await readBarrier;
      return jsonResponse(matches);
    }
    return undefined;
  } });
  const plus = await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  await user.click(plus);
  await user.click(plus);
  await user.click(screen.getByRole("button", { name: "Zatwierdź wynik" }));
  const save = screen.getByRole("button", { name: "Zapisz wynik" });
  await user.dblClick(save);
  await waitFor(() => assert.equal(writes, 1));
  assert.ok(save.matches(":disabled"));
  releaseRead();
  await waitFor(() => assert.equal(screen.queryByRole("button", { name: "Zapisz wynik" }) === null, true));
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A2" });
  assert.match(screen.getByRole("region", { name: "Stan prowadzenia" }).textContent ?? "", /Zakończone1/);
});
