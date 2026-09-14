import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import Host from "./tournament-host";
import Detail from "./tournament-detail";

const originalFetch = globalThis.fetch;
const clients = new Set<QueryClient>();
afterEach(() => { cleanup(); clients.forEach(c => c.clear()); clients.clear(); globalThis.fetch = originalFetch; localStorage.clear(); sessionStorage.clear(); });
const stage = (id: number, status: string) => ({ id, tournamentId: 1, stageKey: `s${id}`, name: id === 1 ? "Eliminacje QA" : "Finał QA", position: id,
  status, format: id === 1 ? "round_robin" : "single_elimination", participantCount: 2, bestOf: 1, currentRound: 1, totalRounds: 2, groups: [], entrySeedingPolicy: "preserve" });
const match = (id: number, round: number, status: string) => ({ id, tournamentId: 1, stageId: 1, round, matchNumber: id, status, bestOf: 1,
  player1Id: 1, player2Id: 2, player1Name: "Alfa", player2Name: "Beta", score1: 1, score2: 0 });

for (const surface of ["Host", "Detail", "Etapy"] as const) {
  test(`${surface}: consistent ready, play, round refetch, complete, qualification, routing and next-ready flow`, async () => {
    localStorage.setItem("tm_role", "organizer"); sessionStorage.setItem("tm_org_1", "qa-token");
    const state = { stages: [stage(1, "planned"), stage(2, "planned")], matches: [match(1, 1, "pending"), match(2, 2, "pending")],
      approved: false, routed: false, tournamentStatus: "draft" };
    globalThis.fetch = async input => {
      const path = String(input);
      const body = path.endsWith("/api/tournaments/1") ? { id: 1, name: "Consistency QA", status: state.tournamentStatus, currentRound: 1, totalRounds: 2,
        format: "round_robin", defaultBestOf: 1, hasOrganizerPassword: true, visibility: "public_online" }
        : path.endsWith("/stages") ? state.stages
        : path.endsWith("/matches") ? state.matches
        : path.endsWith("/stage-baskets") ? { flowAuthority: "basket_v1", baskets: [
          { id: "out", stageId: 1, type: "output", ordinal: 1, qualifierCount: 2, participantIds: [] },
          { id: "in", stageId: 2, type: "input", ordinal: 1, qualifierCount: null, participantIds: [] }],
          routes: [{ id: "route", sourceBasketId: "out", targetBasketId: "in" }], validation: { valid: true, problems: [] } }
        : path.endsWith("/basket-qualification-proposal") ? { proposalId: 1, revision: 1, rankingFingerprint: "qa", status: state.approved ? "approved" : "pending", entries: [] }
        : path.endsWith("/route") ? { materialized: state.routed, sourceOutputApproved: state.approved, routedPlayerCount: state.routed ? 2 : 0 }
        : path.endsWith("/readiness") ? { ready: path.includes("/stages/1/") || state.routed, participantCount: 2, requiredParticipantCount: 2, missingSeeds: [],
          reasonCode: "READY", message: "Gotowość według serwera", basketValidation: { valid: true, problems: [] } }
        : /\/stages\/\d+$/.test(path) ? { stage: state.stages.find(s => path.endsWith(`/${s.id}`)), participants: [], ranking: [], qualifiers: [], groups: [] }
        : path.endsWith("/assistant") ? { stepTitle: "STALE: mecz w toku", nextAction: "Możesz zakończyć turniej" }
        : path.endsWith("/bracket") ? { rounds: [], winner: null } : [];
      return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
    };
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } } }); clients.add(client);
    const path = `/tournaments/1${surface === "Host" ? "/host" : surface === "Etapy" ? "?tab=stages" : "?tab=players"}`;
    window.history.replaceState(null, "", path);
    const location = memoryLocation({ path });
    const View = surface === "Host" ? Host : Detail;
    render(<QueryClientProvider client={client}><Router hook={location.hook} searchHook={location.searchHook}><AuthProvider><View /></AuthProvider></Router></QueryClientProvider>);
    const step = () => document.querySelector('[aria-labelledby="organizer-next-step-title"]')! as HTMLElement;
    const refresh = async () => { await act(async () => { await client.refetchQueries(); }); };
    await waitFor(() => assert.match(step()?.textContent ?? "", /Rozpocznij etap/));
    assert.equal(screen.queryByText(/STALE:/), null);
    state.tournamentStatus = "active"; state.stages[0] = stage(1, "active");
    await refresh();
    await waitFor(() => assert.match(step()?.textContent ?? "", /0 z 2 meczów zakończonych/));
    state.matches[0] = match(1, 1, "completed"); state.matches[1] = match(2, 2, "in_progress");
    // Metadata deliberately remains round 1; old stages and matches must not dictate the current round.
    state.matches.push({ ...match(99, 9, "in_progress"), stageId: 99 });
    await refresh();
    await screen.findAllByText(/Runda 2\/2/);
    assert.match(step().textContent ?? "", /1 z 2 meczów zakończonych/);
    state.matches[1] = match(2, 2, "completed");
    await refresh();
    await waitFor(() => assert.match(step().textContent ?? "", /Zakończ etap/));
    assert.equal(screen.queryByText(/STALE:/), null);
    state.stages[0] = stage(1, "completed");
    await refresh();
    await waitFor(() => assert.match(step().textContent ?? "", /Zatwierdź kwalifikację/));
    assert.doesNotMatch(step().textContent ?? "", /Rozpocznij etap/);
    state.approved = true; await refresh();
    await waitFor(() => assert.match(step().textContent ?? "", /Wykonaj routing/));
    state.routed = true; await refresh();
    await waitFor(() => assert.match(step().textContent ?? "", /Finał QA.*Rozpocznij etap/));
    assert.equal(within(step()).getByRole("link", { name: "Rozpocznij etap" }).getAttribute("href"), "/tournaments/1?tab=stages&stage=2&action=start");
  });
}

test("readiness request error is presented as an unconfirmed state with recovery guidance", async () => {
  localStorage.setItem("tm_role", "organizer");
  sessionStorage.setItem("tm_org_1", "qa-token");
  globalThis.fetch = async input => {
    const path = String(input);
    const body = path.endsWith("/api/tournaments/1")
      ? { id: 1, name: "Readiness error QA", status: "active", currentRound: 0, totalRounds: 1,
          format: "round_robin", defaultBestOf: 1, hasOrganizerPassword: true, visibility: "public_online" }
      : path.endsWith("/stages")
        ? [stage(1, "planned")]
        : path.endsWith("/matches")
          ? []
          : path.endsWith("/stage-baskets")
            ? { flowAuthority: "legacy_v1", baskets: [], routes: [], validation: { valid: true, problems: [] } }
            : path.endsWith("/readiness")
              ? null
              : /\/stages\/\d+$/.test(path)
                ? { stage: stage(1, "planned"), participants: [], ranking: [], qualifiers: [], groups: [] }
                : [];
    if (path.endsWith("/readiness")) {
      return new Response(JSON.stringify({ error: "readiness temporarily unavailable" }), {
        status: 503,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } } });
  clients.add(client);
  const path = "/tournaments/1/host";
  window.history.replaceState(null, "", path);
  const location = memoryLocation({ path });
  render(<QueryClientProvider client={client}><Router hook={location.hook} searchHook={location.searchHook}><AuthProvider><Host /></AuthProvider></Router></QueryClientProvider>);

  await waitFor(() => assert.match(
    document.querySelector('[aria-labelledby="organizer-next-step-title"]')?.textContent ?? "",
    /Nie udało się sprawdzić gotowości etapu/,
  ));
  assert.match(document.querySelector('[aria-labelledby="organizer-next-step-title"]')?.textContent ?? "", /spróbuj ponownie/);
  assert.match(document.querySelector('[aria-labelledby="organizer-next-step-title"]')?.textContent ?? "", /Sprawdź gotowość etapu/);
});
