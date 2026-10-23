/**
 * Component regression tests for TournamentAudience — the spectator view.
 *
 * Covers the UX bug where background polling (refetchInterval=4000) temporarily
 * clears tournamentError, causing the password gate to unmount and remount every
 * 4 seconds (resetting the modal, erasing typed text, and flashing a loading screen).
 *
 * Fix: a useRef latch in TournamentAudience keeps the gate visible until the query
 * actually succeeds (tournament data arrives).
 */

import assert from "node:assert/strict";
import { afterEach, test, describe } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import TournamentAudience from "./tournament-audience";
import { getListTournamentStagesQueryKey } from "@workspace/api-client-react";

// ── helpers ────────────────────────────────────────────────────────────────────

const originalFetch = globalThis.fetch;
const queryClients = new Set<QueryClient>();

afterEach(() => {
  cleanup();
  for (const qc of queryClients) qc.clear();
  queryClients.clear();
  globalThis.fetch = originalFetch;
  window.localStorage.clear();
  window.sessionStorage.clear();
});

/** Minimal JSON response helper */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** 403 that the audience component recognises as VIEWER_PASSWORD_REQUIRED */
function viewerPasswordRequired(): Response {
  return jsonResponse({ code: "VIEWER_PASSWORD_REQUIRED", error: "Viewer password required" }, 403);
}

/** Minimal successful tournament payload */
function tournamentPayload(gameConfig?: unknown) {
  return {
    id: 1,
    name: "Test Tournament",
    format: "single_elimination",
    status: "active",
    resultModelVersion: "series_v1",
    rankingPolicy: "match_record_v1",
    defaultBestOf: 1,
    hasHostCode: false,
    hasOrganizerPassword: false,
    hasSupportPassword: false,
    visibility: "public_online",
    activeStageId: null,
    currentRound: null,
    totalRounds: null,
    featuredMatchId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...(gameConfig === undefined ? {} : { gameConfig }),
  };
}

/** Mount TournamentAudience at /tournaments/1/audience with a controlled QueryClient */
function renderAudience(fetchImpl: typeof fetch, refetchInterval?: number, section = "live") {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        // Override refetchInterval so tests don't rely on real timers;
        // component-level refetchInterval is still set for type-accuracy but
        // we control refetches manually via qc.refetchQueries().
        refetchInterval: false,
      },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  queryClients.add(qc);
  const location = memoryLocation({ path: `/tournaments/1/audience?section=${section}` });
  globalThis.fetch = fetchImpl;
  render(
    <QueryClientProvider client={qc}>
      <Router hook={location.hook} searchHook={location.searchHook}>
        <AuthProvider>
          <TournamentAudience />
        </AuthProvider>
      </Router>
    </QueryClientProvider>,
  );
  return qc;
}

// ── tests ──────────────────────────────────────────────────────────────────────

test("public match rows stay compact without changing order, scores or statuses", async () => {
  const variants = [
    { status: "pending", resultType: null, score1: null, score2: null, label: "Oczekuje", score: "vs" },
    { status: "in_progress", resultType: null, score1: 1, score2: 0, label: "W trakcie", score: "1:0" },
    { status: "completed", resultType: "played", score1: 2, score2: 1, label: "Zakończony", score: "2:1" },
    { status: "completed", resultType: "walkover", score1: null, score2: null, label: "Zakończony", score: "vs" },
    { status: "completed", resultType: "no_contest", score1: null, score2: null, label: "Zakończony", score: "vs" },
  ];
  const matches = variants.map((variant, i) => ({ ...variant, id: i + 1, revision: 1, tournamentId: 1,
    round: 1, matchNumber: 5 - i, bestOf: 3, player1Id: i * 2 + 1, player2Id: i * 2 + 2,
    player1Name: `DługaNazwaZawodnika${i}`.repeat(5), player2Name: `Rywal ${i}`, winnerId: i === 2 || i === 3 ? i * 2 + 1 : null }));
  renderAudience(async input => {
    const url = String(input);
    if (url.endsWith("/api/tournaments/1")) return jsonResponse(tournamentPayload());
    if (url.endsWith("/matches")) return jsonResponse(matches);
    if (url.endsWith("/bracket")) return jsonResponse({ rounds: [], winner: null });
    return jsonResponse([]);
  }, undefined, "matches");
  const section = await screen.findByRole("region", { name: "Mecze" });
  await waitFor(() => assert.equal(within(section).getAllByRole("article").length, 5));
  within(section).getAllByRole("article").forEach((row, i) => {
    assert.ok(row.classList.contains("md:grid-cols-[8rem_minmax(0,1fr)_auto]"));
    assert.ok(row.classList.contains("py-2.5"));
    assert.ok(within(row).getByText(`Runda 1 · Mecz ${5 - i}`));
    assert.ok(within(row).getByText(variants[i].label));
    assert.ok(within(row).getByText(variants[i].score));
    assert.ok(within(row).getByText("BO3"));
    const player = within(row).getByText(matches[i].player1Name);
    assert.equal(player.getAttribute("title"), matches[i].player1Name);
    assert.ok(player.classList.contains("truncate"));
    assert.equal(player.classList.contains("text-cyan-300"), i === 2 || i === 3);
  });
});

test("public header can wrap its actions and keeps all navigation links with a long tournament name", async () => {
  window.localStorage.setItem("tm_role", "organizer");
  window.sessionStorage.setItem("tm_org_1", "test-organizer-token");
  const name = "BardzoDługaNazwaTurnieju".repeat(12);
  renderAudience(async input => {
    const url = String(input);
    if (url.endsWith("/api/tournaments/1")) return jsonResponse({ ...tournamentPayload(), name });
    if (url.endsWith("/bracket")) return jsonResponse({ rounds: [], winner: null });
    return jsonResponse([]);
  });
  const heading = await screen.findByRole("heading", { name, level: 1 });
  const header = screen.getByRole("banner");
  assert.ok(header.classList.contains("flex-wrap"));
  assert.ok(heading.classList.contains("min-w-0"));
  assert.equal(heading.getAttribute("title"), name);
  const panel = within(header).getByRole("link", { name: "Panel organizatora" });
  assert.equal(panel.getAttribute("href"), "/tournaments/1");
  assert.ok(panel.parentElement?.classList.contains("flex-wrap"));
  assert.ok(within(header).getByRole("link", { name: "Wróć do dashboardu" }));
  const nav = screen.getByRole("navigation", { name: "Sekcje publicznego widoku turnieju" });
  assert.equal(within(nav).getAllByRole("link").length, 6);
  assert.ok(nav.firstElementChild?.classList.contains("overflow-x-auto"));
  assert.ok(nav.classList.contains("min-w-0"));
});

test("completed Audience names the persisted winner, not the aggregate standings leader", async () => {
  const qc = renderAudience(async (input) => {
    const url = String(input);
    if (url.endsWith("/api/tournaments/1")) {
      return jsonResponse({ ...tournamentPayload(), status: "completed", winnerId: 2 });
    }
    if (url.endsWith("/standings")) return jsonResponse([
      { playerId: 1, playerName: "Earlier stage leader", rank: 1, matchWins: 5 },
      { playerId: 2, playerName: "Final champion", rank: 2, matchWins: 3 },
    ]);
    if (url.endsWith("/bracket")) return jsonResponse({ rounds: [], winner: null });
    return jsonResponse([]);
  });
  const assertWinner = () => {
    const summary = screen.getByText("Turniej zakończony!").parentElement!;
    assert.match(summary.textContent!, /Zwycięzca: Final champion/);
    assert.doesNotMatch(summary.textContent!, /Earlier stage leader/);
  };
  await waitFor(assertWinner, { timeout: 3000 });
  await act(async () => { await qc.refetchQueries(); });
  assertWinner();
});

test("multi-stage standings do not advertise qualification or podium places", async () => {
  const standing = { playerId: 1, playerName: "Alpha", rank: 1, matchesPlayed: 3, matchWins: 2, matchLosses: 1, gameWins: 2, gameLosses: 1, gameDiff: 1, status: "active" };
  renderAudience(async input => {
    const url = String(input);
    if (url.endsWith("/api/tournaments/1")) return jsonResponse({ ...tournamentPayload(), format: "round_robin", activeStageId: 2 });
    if (url.endsWith("/stages")) return jsonResponse([
      { id: 1, position: 1, name: "Grupy", status: "completed", format: "round_robin" },
      { id: 2, position: 2, name: "Playoff", status: "active", format: "single_elimination" },
    ]);
    if (url.endsWith("/standings")) return jsonResponse([standing]);
    if (url.endsWith("/bracket")) return jsonResponse({ rounds: [], winner: null });
    return jsonResponse([]);
  }, undefined, "standings");
  const panel = await screen.findByRole("region", { name: "Bilans łączny meczów — wszystkie etapy" });
  assert.match(panel.textContent ?? "", /Awans i zwycięzcę wyznaczają wyniki etapów/);
  assert.equal(within(panel).queryByRole("columnheader", { name: "Miejsce" }), null);
});

test("single-stage standings retain ranked-table presentation", async () => {
  renderAudience(async input => {
    const url = String(input);
    if (url.endsWith("/api/tournaments/1")) return jsonResponse({ ...tournamentPayload(), format: "round_robin", activeStageId: 1 });
    if (url.endsWith("/stages")) return jsonResponse([{ id: 1, position: 1, name: "Grupy", status: "active", format: "round_robin" }]);
    if (url.endsWith("/standings")) return jsonResponse([{ playerId: 1, playerName: "Alpha", rank: 1, matchesPlayed: 1, matchWins: 1, matchLosses: 0, gameWins: 1, gameLosses: 0, gameDiff: 1, status: "active" }]);
    if (url.endsWith("/bracket")) return jsonResponse({ rounds: [], winner: null });
    return jsonResponse([]);
  }, undefined, "standings");
  const panel = await screen.findByRole("region", { name: "Klasyfikacja" });
  assert.ok(within(panel).getByRole("columnheader", { name: "Miejsce" }));
});

test("cached one-stage standings become neutral after failed stage refetch without changing persisted winner", async () => {
  const stages = [{ id: 1, position: 1, name: "Grupy", status: "completed", format: "round_robin" }];
  let stageRequestFails = false;
  const qc = renderAudience(async input => {
    const url = String(input);
    if (url.endsWith("/api/tournaments/1")) {
      return jsonResponse({ ...tournamentPayload(), status: "completed", format: "round_robin", activeStageId: 1, winnerId: 2 });
    }
    if (url.endsWith("/stages")) {
      return stageRequestFails
        ? jsonResponse({ code: "STAGES_TEMPORARILY_UNAVAILABLE", error: "Stage refresh failed" }, 503)
        : jsonResponse(stages);
    }
    if (url.endsWith("/standings")) return jsonResponse([
      { playerId: 1, playerName: "Earlier stage leader", rank: 1, matchesPlayed: 5, matchWins: 5, matchLosses: 0, gameWins: 5, gameLosses: 0, gameDiff: 5, status: "active" },
      { playerId: 2, playerName: "Final champion", rank: 2, matchesPlayed: 3, matchWins: 3, matchLosses: 0, gameWins: 3, gameLosses: 0, gameDiff: 3, status: "active" },
    ]);
    if (url.endsWith("/bracket")) return jsonResponse({ rounds: [], winner: null });
    return jsonResponse([]);
  }, undefined, "standings");

  const key = getListTournamentStagesQueryKey(1);
  const rankedPanel = await screen.findByRole("region", { name: "Klasyfikacja" });
  assert.ok(within(rankedPanel).getByRole("columnheader", { name: "Miejsce" }));
  const winnerBefore = screen.getByText("Turniej zakończony!").parentElement!;
  assert.match(winnerBefore.textContent ?? "", /Zwycięzca: Final champion/);
  assert.doesNotMatch(winnerBefore.textContent ?? "", /Zwycięzca: Earlier stage leader/);

  stageRequestFails = true;
  await act(async () => {
    await qc.refetchQueries({ queryKey: key, exact: true, type: "active" });
  });

  await waitFor(() => {
    assert.equal(qc.getQueryState(key)?.status, "error");
    assert.deepEqual(qc.getQueryData(key), stages, "A failed refetch must leave earlier one-stage data cached");
    const neutralPanel = screen.getByRole("region", { name: "Bilans informacyjny — zakres etapów niepotwierdzony" });
    assert.equal(within(neutralPanel).queryByRole("columnheader", { name: "Miejsce" }), null);
    assert.equal(within(neutralPanel).queryByText("🥇"), null);
    assert.match(neutralPanel.textContent ?? "", /nie jest podstawą awansu ani wyłonienia zwycięzcy/);
  });
  const winnerAfter = screen.getByText("Turniej zakończony!").parentElement!;
  assert.match(winnerAfter.textContent ?? "", /Zwycięzca: Final champion/);
  assert.doesNotMatch(winnerAfter.textContent ?? "", /Zwycięzca: Earlier stage leader/);
});

describe("TournamentAudience — password gate regression", () => {

  test("private_online without viewer session shows password gate", async () => {
    renderAudience(async () => viewerPasswordRequired());

    // Gate must appear — locks icon + heading + button
    await waitFor(() => {
      assert.ok(screen.queryByText("Turniej prywatny"), "gate heading missing");
    });
    assert.ok(screen.queryByRole("button", { name: /hasło widza/i }), "viewer button missing");
  });

  test("password modal opens when the gate button is clicked", async () => {
    renderAudience(async () => viewerPasswordRequired());

    await waitFor(() => screen.getByRole("button", { name: /hasło widza/i }));
    await userEvent.click(screen.getByRole("button", { name: /hasło widza/i }));

    // Modal appears as a fixed overlay (no role="dialog") — look for the heading inside it
    await waitFor(() => {
      // The modal renders an h2 "Hasło widza" and a password input
      const heading = screen.queryByRole("heading", { name: /hasło widza/i });
      const passwordInput = document.querySelector<HTMLInputElement>("input[type='password']");
      assert.ok(heading ?? passwordInput, "password modal did not open");
    });
  });

  test("gate and modal stay mounted — typed password survives background refetch", async () => {
    let fetchCount = 0;
    const qc = renderAudience(async (input) => {
      fetchCount += 1;
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
      // All /api/tournaments/1 requests return VIEWER_PASSWORD_REQUIRED
      if (url.includes("/api/tournaments/1")) return viewerPasswordRequired();
      return new Response(null, { status: 404 });
    });

    // 1. Gate appears
    await waitFor(() => screen.getByRole("button", { name: /hasło widza/i }));

    // 2. Open modal
    await userEvent.click(screen.getByRole("button", { name: /hasło widza/i }));

    // 3. Type a partial password into the first password-type input inside the modal
    await waitFor(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>("input[type='password'],input[type='text']");
      assert.ok(inputs.length > 0, "no text/password input found in modal");
    });
    const passwordInput = document.querySelector<HTMLInputElement>(
      "input[type='password'],input[type='text']",
    )!;
    await userEvent.type(passwordInput, "secret");
    assert.equal(passwordInput.value, "secret", "typed value should appear in input");

    // 4. Simulate background refetch — React Query temporarily clears the error
    //    then the re-fetch returns the same error. Without the latch fix, the gate
    //    would unmount here, resetting the modal and erasing "secret".
    await act(async () => {
      await qc.refetchQueries({ type: "all" });
    });

    // 5. Gate heading must still be visible (not replaced by a loading flash)
    assert.ok(screen.queryByText("Turniej prywatny"), "gate disappeared after background refetch");

    // 6. The modal must still be open (not remounted)
    const stillPasswordInput = document.querySelector<HTMLInputElement>(
      "input[type='password'],input[type='text']",
    );
    assert.ok(stillPasswordInput, "password input disappeared after refetch — modal was remounted");

    // 7. Typed value must still be there
    assert.equal(
      stillPasswordInput!.value,
      "secret",
      "typed password was erased by background refetch",
    );
  });

  test("correct viewer session clears gate and shows normal viewer content", async () => {
    // Start with error; after viewer token is present (simulated via localStorage),
    // the component re-queries and succeeds.
    let hasViewerToken = false;
    const qc = renderAudience(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
      if (url.includes("/api/tournaments/1")) {
        if (hasViewerToken) return jsonResponse(tournamentPayload());
        return viewerPasswordRequired();
      }
      // Matches, standings, players, bracket endpoints
      if (url.includes("/api/tournaments/")) return jsonResponse([]);
      return new Response(null, { status: 404 });
    });

    // Gate appears
    await waitFor(() => screen.getByRole("button", { name: /hasło widza/i }));

    // Simulate the viewer token being stored and the query being refetched (as happens
    // after ViewerLoginModal.onSuccess calls storeViewerToken + refetchTournament)
    hasViewerToken = true;
    await act(async () => {
      await qc.resetQueries();
      await qc.refetchQueries({ type: "all" });
    });

    // Gate must be gone; tournament name must appear
    await waitFor(() => {
      assert.ok(
        !screen.queryByText("Turniej prywatny"),
        "gate still showing after successful authentication",
      );
      assert.ok(
        screen.queryByText("Test Tournament"),
        "tournament name not visible after authentication",
      );
    });
  });

  test("viewer header shows the forced Deadlock hero", async () => {
    renderAudience(async (input) => {
      const url = typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;
      if (url.endsWith("/api/tournaments/1")) {
        return jsonResponse(tournamentPayload({
          gameId: "deadlock",
          configVersion: 1,
          config: { forcedHeroId: "rem" },
        }));
      }
      if (url.includes("/stages")) return jsonResponse([]);
      if (url.includes("/bracket")) return jsonResponse({ rounds: [], winner: null });
      return jsonResponse([]);
    });
    await waitFor(() => assert.ok(screen.getByText(/Rem/)));
  });

});
