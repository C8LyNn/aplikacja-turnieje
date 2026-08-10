import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import TournamentHost from "./tournament-host";

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
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
