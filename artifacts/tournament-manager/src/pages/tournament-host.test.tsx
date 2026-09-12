import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import TournamentHost from "./tournament-host";

const originalFetch = globalThis.fetch;
const clients = new Set<QueryClient>();

async function refreshHost() {
  await act(async () => { await Promise.all([...clients].map(client => client.invalidateQueries())); });
}

test("editing the suggested match pins its draft when another match becomes LIVE", async () => {
  const matches = [hostMatch(1), hostMatch(2)];
  const user = await renderOperationalHost({ matches });
  await user.click(await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  matches[1] = { ...matches[1], status: "in_progress" };
  await refreshHost();
  await screen.findByRole("button", { name: /Gracz A2 vs Gracz B2.*LIVE/ });
  assert.ok(screen.getByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  assert.ok(screen.getByRole("button", { name: "Zmniejsz wynik: Gracz A1" }).matches(":enabled"));
  assert.ok(screen.getByRole("button", { name: "Zmniejsz wynik: Gracz B1" }).matches(":disabled"));
  assert.ok(screen.getByRole("button", { name: "Zapisz wynik" }).matches(":disabled"));
});

test("explicit selection keeps its 1:0 draft when another match finishes and the recommendation changes", async () => {
  const matches = [hostMatch(1), hostMatch(2, 2, "in_progress"), hostMatch(3)];
  const user = await renderOperationalHost({ matches });
  await user.click(await screen.findByRole("button", { name: /Gracz A1 vs Gracz B1/ }));
  await user.click(screen.getByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  matches[1] = { ...matches[1], status: "completed", resultType: "played", score1: 2 };
  matches[2] = { ...matches[2], status: "in_progress" };
  await refreshHost();
  await screen.findByRole("button", { name: /Gracz A3 vs Gracz B3.*LIVE/ });
  assert.ok(screen.getByRole("button", { name: "Zmniejsz wynik: Gracz A1" }).matches(":enabled"));
  assert.ok(screen.getByRole("button", { name: "Zapisz wynik" }).matches(":disabled"));
  await user.click(screen.getByRole("button", { name: /Gracz A3 vs Gracz B3/ }));
  assert.ok(screen.getByRole("button", { name: "Zmniejsz wynik: Gracz A3" }).matches(":disabled"));
  assert.equal(screen.queryByRole("button", { name: "Odrzuć wynik roboczy" }), null);
  await user.click(screen.getByRole("button", { name: /Gracz A1 vs Gracz B1/ }));
  assert.ok(screen.getByRole("button", { name: "Zmniejsz wynik: Gracz A1" }).matches(":enabled"));
});

test("an untouched automatic suggestion follows the refreshed LIVE match", async () => {
  const matches = [hostMatch(1), hostMatch(2)];
  await renderOperationalHost({ matches });
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  matches[1] = { ...matches[1], status: "in_progress" };
  await refreshHost();
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A2" });
});

test("remote completion keeps the edited match and its stale draft in context", async () => {
  const matches = [hostMatch(1), hostMatch(2)];
  const user = await renderOperationalHost({ matches });
  await user.click(await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  matches[0] = { ...matches[0], status: "completed", resultType: "played", score2: 2 };
  await refreshHost();
  await screen.findByText(/Twój wynik roboczy: 1:0. Aktualny wynik: 0:2/);
  assert.ok(screen.getByRole("button", { name: "Zwiększ wynik: Gracz A1" }).matches(":disabled"));
  assert.equal(screen.queryByRole("button", { name: "Zwiększ wynik: Gracz A2" }), null);
  assert.equal(screen.queryByText("Wynik zapisany!"), null);
});

test("correction remains attached to A while another match changes", async () => {
  const matches = [{ ...hostMatch(1, 2, "completed"), resultType: "played" as const, score1: 2 }, hostMatch(2)];
  const user = await renderOperationalHost({ matches });
  await user.click(await screen.findByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" }));
  matches[1] = { ...matches[1], status: "in_progress" };
  await refreshHost();
  await screen.findByRole("button", { name: /Gracz A2 vs Gracz B2.*LIVE/, hidden: true });
  assert.match(screen.getByRole("dialog").textContent ?? "", /Gracz A1 – Gracz B1/);
});

test("a removed selected match clears its draft with an explanation before suggesting another", async () => {
  const matches = [hostMatch(1), hostMatch(2)];
  const user = await renderOperationalHost({ matches });
  await user.click(await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  matches.shift();
  await refreshHost();
  await screen.findByText(/Wybrany mecz nie jest już dostępny/);
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A2" });
  assert.ok(screen.getByRole("button", { name: "Zmniejsz wynik: Gracz A2" }).matches(":disabled"));
  assert.equal(screen.queryByRole("button", { name: "Odrzuć wynik roboczy" }), null);
  const unload = new window.Event("beforeunload", { cancelable: true });
  window.dispatchEvent(unload);
  assert.equal(unload.defaultPrevented, false);
});

test("failed refetch keeps selection and draft instead of treating a match as removed", async () => {
  let failed = false;
  const user = await renderOperationalHost({ matches: [hostMatch(1), hostMatch(2)], intercept: async path =>
    failed && path.endsWith("/matches") ? new Response("unavailable", { status: 503 }) : undefined });
  for (const client of clients) client.setQueryDefaults(["/api/tournaments/1/matches"], { retry: false });
  await user.click(await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  failed = true;
  await refreshHost();
  await screen.findByText("Nie udało się odświeżyć stanu prowadzenia.");
  assert.equal(screen.queryByText(/Wybrany mecz nie jest już dostępny/), null);
  failed = false;
  await refreshHost();
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  assert.ok(screen.getByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  assert.ok(screen.getByRole("button", { name: "Odrzuć wynik roboczy" }));
  assert.equal(screen.queryByText(/Wybrany mecz nie jest już dostępny/), null);
});

test("keyboard focus pins the form before the first score change", async () => {
  const matches = [hostMatch(1), hostMatch(2)];
  await renderOperationalHost({ matches });
  const plus = await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  act(() => plus.focus());
  matches[1] = { ...matches[1], status: "in_progress" };
  await refreshHost();
  await screen.findByRole("button", { name: /Gracz A2 vs Gracz B2.*LIVE/ });
  assert.ok(screen.getByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
});

test("a conflict refreshes the same match without switching to the next available match", async () => {
  const matches = [hostMatch(1), hostMatch(2)];
  const user = await renderOperationalHost({ matches, intercept: async path => {
    if (!path.endsWith("/1/complete")) return undefined;
    matches[0] = { ...matches[0], status: "completed", resultType: "played", score2: 2 };
    return new Response(JSON.stringify({ code: "MATCH_ALREADY_FINALIZED" }), { status: 409, headers: { "content-type": "application/json" } });
  } });
  const plus = await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  await user.click(plus); await user.click(plus);
  await user.click(screen.getByRole("button", { name: "Zapisz wynik" }));
  await screen.findByText(/Twój wynik roboczy: 2:0. Aktualny wynik: 0:2/);
  assert.match(screen.getByRole("alert").textContent ?? "", /Ten mecz ma już zapisany wynik/);
  assert.equal(screen.queryByRole("button", { name: "Zwiększ wynik: Gracz A2" }), null);
  assert.equal(screen.queryByText("Wynik zapisany!"), null);
});

test("correction closes with an explanation if its match is actually removed", async () => {
  const matches = [{ ...hostMatch(1, 2, "completed"), resultType: "played" as const, score1: 2 }, hostMatch(2)];
  const user = await renderOperationalHost({ matches });
  await user.click(await screen.findByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" }));
  matches.shift();
  await refreshHost();
  await screen.findByText(/Wybrany mecz nie jest już dostępny/);
  assert.equal(screen.queryByRole("dialog"), null);
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A2" });
});

afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.clear();
  globalThis.fetch = originalFetch;
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState(null, "", "/tournaments/1/host");
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

function hostMatch(id: number, stageId: number | null = 2, status = "pending") {
  return { id, tournamentId: 1, stageId, round: 1, matchNumber: id, status, bestOf: 3,
    player1Id: id * 2, player2Id: id * 2 + 1, player1Name: `Gracz A${id}`, player2Name: `Gracz B${id}`,
    score1: 0, score2: 0, resultType: null as "played" | null, winnerId: null };
}

async function renderOperationalHost(options: {
  matches: ReturnType<typeof hostMatch>[];
  stages?: ReturnType<typeof hostStage>[];
  tab?: string;
  intercept?: (path: string, init?: RequestInit) => Promise<Response | undefined>;
}) {
  window.localStorage.setItem("tm_role", "organizer");
  window.sessionStorage.setItem("tm_org_1", "test-organizer-token");
  window.history.replaceState(null, "", `/tournaments/1/host${options.tab ? `?tab=${options.tab}` : ""}`);
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
  const location = memoryLocation({ path: `/tournaments/1/host${options.tab ? `?tab=${options.tab}` : ""}` });
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

test("Host retains a partial score on failure and retries the same complete result", async () => {
  const matches = [{ ...hostMatch(1), score1: 1, score2: 1 }];
  let writes = 0;
  const user = await renderOperationalHost({ matches, intercept: async (path, init) => {
    if (path !== "/api/matches/1/complete") return undefined;
    writes++;
    assert.deepEqual(JSON.parse(String(init?.body)), { resultType: "played", score1: 2, score2: 1 });
    if (writes === 1) return new Response("unavailable", { status: 503 });
    matches[0] = { ...matches[0], score1: 2, status: "completed", resultType: "played" };
    return jsonResponse(matches[0]);
  } });
  await user.click(await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  await user.click(screen.getByRole("button", { name: "Zapisz wynik" }));
  await screen.findByRole("alert");
  assert.match(screen.getByRole("alert").textContent ?? "", /Wpisany wynik pozostaje/);
  await waitFor(() => assert.equal(screen.getByRole("button", { name: "Zapisz wynik" }).matches(":disabled"), false));
  await user.click(screen.getByRole("button", { name: "Zapisz wynik" }));
  await screen.findByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" });
  assert.equal(writes, 2);
  assert.equal(screen.queryByRole("alert") === null, true);
});

test("Host refreshes a concurrent completion without reporting success or replacing it with the draft", async () => {
  const matches = [hostMatch(1)];
  let reads = 0;
  const user = await renderOperationalHost({ matches, intercept: async (path) => {
    if (path.endsWith("/matches")) reads++;
    if (path !== "/api/matches/1/complete") return undefined;
    matches[0] = { ...matches[0], status: "completed", resultType: "played", score1: 0, score2: 2 };
    return new Response(JSON.stringify({ code: "MATCH_ALREADY_FINALIZED" }), { status: 409, headers: { "content-type": "application/json" } });
  } });
  const plus = await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  await user.click(plus); await user.click(plus);
  await user.click(screen.getByRole("button", { name: "Zapisz wynik" }));
  await screen.findByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" });
  assert.ok(reads >= 2);
  assert.match(screen.getByRole("alert").textContent ?? "", /Ten mecz ma już zapisany wynik/);
  assert.ok(screen.getByText("0:2"));
  assert.equal(screen.queryByText("Wynik zapisany!") === null, true);
});

test("Host correction identifies the saved result and returns to score entry after reverting", async () => {
  const matches = [{ ...hostMatch(1), status: "completed", resultType: "played" as const, score1: 2, score2: 1 }];
  let writes = 0;
  let finish: () => void = () => {};
  const user = await renderOperationalHost({ matches, intercept: async (path) => {
    if (path !== "/api/matches/1/revert") return undefined;
    writes++;
    await new Promise<void>((resolve) => { finish = resolve; });
    Object.assign(matches[0], { status: "pending", resultType: null, score1: 0, score2: 0 });
    return jsonResponse(matches[0]);
  } });
  await user.click(await screen.findByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" }));
  const dialog = screen.getByRole("dialog");
  assert.match(dialog.textContent ?? "", /Cofnąć wynik meczu Gracz A1 – Gracz B1.*2:1.*Ranking i awans/);
  const confirm = within(dialog).getByRole("button", { name: "Cofnij wynik i przejdź do wpisywania" });
  await user.dblClick(confirm);
  assert.equal(writes, 1);
  assert.ok(confirm.matches(":disabled"));
  finish();
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" });
  await waitFor(() => assert.equal(screen.queryByRole("dialog") === null, true));
  assert.ok(screen.getByRole("button", { name: "Zapisz wynik" }));
});

test("Host match list separates identical round numbers across stages and puts LIVE first", async () => {
  await renderOperationalHost({ tab: "wyniki", matches: [hostMatch(100, 1, "completed"), hostMatch(1), hostMatch(2, 2, "in_progress")] });
  const finals = await screen.findByRole("region", { name: "Mecze: Finały szkoleniowe" });
  assert.equal(within(finals).queryByText(/Gracz A100/) === null, true);
  assert.match(finals.textContent ?? "", /Gracz A2.*LIVE.*Gracz A1.*Oczekuje/);
  assert.match(screen.getByRole("region", { name: "Mecze: Eliminacje" }).textContent ?? "", /Gracz A100.*Zakończony/);
});

test("Host protects draft scores against reload and releases the guard after discarding", async () => {
  const user = await renderOperationalHost({ matches: [hostMatch(1)] });
  await user.click(await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  const unload = new window.Event("beforeunload", { cancelable: true });
  window.dispatchEvent(unload);
  assert.equal(unload.defaultPrevented, true);
  await user.click(screen.getByRole("button", { name: "Odrzuć wynik roboczy" }));
  const nextUnload = new window.Event("beforeunload", { cancelable: true });
  window.dispatchEvent(nextUnload);
  assert.equal(nextUnload.defaultPrevented, false);
});

test("Host keeps a draft but requires review if a refetch changes the players", async () => {
  const matches = [hostMatch(1)];
  const user = await renderOperationalHost({ matches });
  await user.click(await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A1" }));
  matches[0] = { ...matches[0], player1Id: 99, player1Name: "Nowy gracz" };
  await act(async () => { await Promise.all([...clients].map(client => client.invalidateQueries())); });
  await screen.findByText(/Stan meczu zmienił się od rozpoczęcia edycji/);
  assert.ok(screen.getByRole("button", { name: "Zapisz wynik" }).matches(":disabled"));
  await user.click(screen.getByRole("button", { name: "Odrzuć wynik roboczy" }));
  assert.equal(screen.getByRole("button", { name: "Zwiększ wynik: Nowy gracz" }).matches(":disabled"), false);
});

test("Host keeps a blocked correction open with an operational explanation and allows cancellation", async () => {
  const matches = [{ ...hostMatch(1), status: "completed", resultType: "played" as const, score1: 2 }];
  const user = await renderOperationalHost({ matches, intercept: async (path) => path.endsWith("/revert")
    ? new Response(JSON.stringify({ code: "DOWNSTREAM_BLOCKED" }), { status: 409, headers: { "content-type": "application/json" } }) : undefined });
  await user.click(await screen.findByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" }));
  await user.click(screen.getByRole("button", { name: "Cofnij wynik i przejdź do wpisywania" }));
  const dialog = screen.getByRole("dialog");
  await within(dialog).findByText(/zależne mecze lub kolejna runda już się rozpoczęły/);
  await waitFor(() => assert.equal(within(dialog).getByRole("button", { name: "Zachowaj wynik" }).matches(":disabled"), false));
  await user.click(within(dialog).getByRole("button", { name: "Zachowaj wynik" }));
  await waitFor(() => assert.equal(screen.queryByRole("dialog") === null, true));
  assert.ok(screen.getByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" }));
});

test("Host keeps all results reachable after stages finish", async () => {
  const user = await renderOperationalHost({ stages: [hostStage(2, "completed")], matches: [{ ...hostMatch(1), status: "completed", resultType: "played", score1: 2 }] });
  await user.click(await screen.findByRole("link", { name: "Wszystkie mecze i wyniki" }));
  await screen.findByRole("region", { name: "Mecze: Finały szkoleniowe" });
  assert.ok(screen.getByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" }));
});

test("Host all-match list retains legacy matches without stage assignment", async () => {
  await renderOperationalHost({ tab: "wyniki", matches: [hostMatch(1), hostMatch(90, null, "completed")] });
  const legacy = await screen.findByRole("region", { name: "Mecze: Mecze bez przypisanego etapu" });
  assert.match(legacy.textContent ?? "", /Gracz A90.*Zakończony/);
});

test("Host correction shows the downstream count supplied for the selected DE stage", async () => {
  const user = await renderOperationalHost({ stages: [{ ...hostStage(), format: "double_elimination" }],
    matches: [{ ...hostMatch(1), status: "completed", resultType: "played", score1: 2 }],
    intercept: async path => path.endsWith("/double-elimination") ? jsonResponse({ matches: [{ matchId: 1, downstreamResultCount: 3 }] }) : undefined });
  await user.click(await screen.findByRole("button", { name: "Popraw wynik: Gracz A1 – Gracz B1" }));
  await within(screen.getByRole("dialog")).findByText(/unieważni także 3 późniejszych wyników/);
  await waitFor(() => assert.equal(screen.getByRole("button", { name: "Cofnij wynik i przejdź do wpisywania" }).matches(":disabled"), false));
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
  const save = screen.getByRole("button", { name: "Zapisz wynik" });
  await user.dblClick(save);
  await waitFor(() => assert.equal(writes, 1));
  assert.ok(save.matches(":disabled"));
  releaseRead();
  await screen.findByRole("button", { name: "Zwiększ wynik: Gracz A2" });
  await waitFor(() => assert.equal(screen.getByRole("button", { name: "Zwiększ wynik: Gracz A2" }).matches(":disabled"), false));
  assert.match(screen.getByRole("region", { name: "Stan prowadzenia" }).textContent ?? "", /Zakończone1/);
});
