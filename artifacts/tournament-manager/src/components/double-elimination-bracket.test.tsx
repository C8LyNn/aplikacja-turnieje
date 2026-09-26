import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getGetDoubleEliminationStageQueryKey, getListMatchesQueryKey, type Match, type DoubleEliminationStageState } from "@workspace/api-client-react";
import { DoubleEliminationBracket } from "./double-elimination-bracket";

const originalFetch = globalThis.fetch;
const originalConfirm = window.confirm;
const clients = new Set<QueryClient>();
afterEach(() => {
  cleanup();
  clients.forEach(client => client.clear()); clients.clear();
  globalThis.fetch = originalFetch; window.confirm = originalConfirm;
});

const state: DoubleEliminationStageState = {
  tournamentId: 1,
  stageId: 2,
  revision: 4,
  completed: false,
  championParticipantKey: null,
  participants: [
    { participantKey: "p1", playerId: 11, name: "Alpha", seed: 1, losses: 0, status: "active" },
    { participantKey: "p2", playerId: 12, name: "Bravo", seed: 2, losses: 1, status: "active" },
  ],
  matches: [
    { matchKey: "u1", matchId: 101, name: "Upper 1", bracket: "upper", round: 1, matchNumber: 1, order: 0, slots: ["p1", "p2"], status: "completed", bestOf: 3, score1: 2, score2: 0, downstreamResultCount: 0, winnerParticipantKey: "p1", loserParticipantKey: "p2" },
    { matchKey: "l1", matchId: null, name: "Lower 1", bracket: "lower", round: 1, matchNumber: 1, order: 1, slots: ["p2", null], status: "blocked", bestOf: null, score1: null, score2: null, downstreamResultCount: 0, winnerParticipantKey: null, loserParticipantKey: null },
    { matchKey: "gf", matchId: null, name: "Grand Final", bracket: "grand_final", round: 1, matchNumber: 1, order: 2, slots: [null, null], status: "blocked", bestOf: null, score1: null, score2: null, downstreamResultCount: 0, winnerParticipantKey: null, loserParticipantKey: null },
    { matchKey: "gfr", matchId: null, name: "Grand Final Reset", bracket: "grand_final_reset", round: 1, matchNumber: 1, order: 3, slots: [null, null], status: "blocked", bestOf: null, score1: null, score2: null, downstreamResultCount: 0, winnerParticipantKey: null, loserParticipantKey: null },
  ],
};

test("renders all Double Elimination brackets read-only for viewers", () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.add(queryClient);
  render(
    <QueryClientProvider client={queryClient}>
      <DoubleEliminationBracket tournamentId={1} stageId={2} state={state} />
    </QueryClientProvider>,
  );

  assert.ok(screen.getByText("Upper Bracket"));
  assert.ok(screen.getByText("Lower Bracket"));
  assert.ok(screen.getAllByText("Grand Final").length >= 1);
  assert.ok(screen.getAllByText("Grand Final Reset").length >= 1);
  assert.equal(screen.queryByRole("button", { name: /Resetuj etap/ }), null);
  assert.equal(screen.queryByRole("button", { name: /Ustaw|Wygrywa/ }), null);
});

function canonicalMatch(): Match {
  return { id: 101, revision: 7, tournamentId: 1, stageId: 2, round: 1, matchNumber: 1, bestOf: 3, status: "pending",
    player1Id: 11, player2Id: 12, player1Name: "Alpha", player2Name: "Bravo", score1: 0, score2: 0 };
}
function renderManagement(current: () => DoubleEliminationStageState, canonical: () => Match = () => {
  const graph = current().matches[0];
  return { ...canonicalMatch(), status: graph.status === "completed" ? "completed" as const : "pending" as const,
    score1: graph.score1, score2: graph.score2 };
}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });
  clients.add(client);
  const mutationFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    if (String(input).endsWith("/tournaments/1/matches")) return new Response(JSON.stringify([canonical()]), { headers: { "content-type": "application/json" } });
    return mutationFetch(input, init);
  };
  client.setQueryData(getListMatchesQueryKey(1), [canonical()]);
  function Management() {
    const query = useQuery({ queryKey: getGetDoubleEliminationStageQueryKey(1, 2), queryFn: async () => current(), initialData: current() });
    return <DoubleEliminationBracket tournamentId={1} stageId={2} state={query.data} canManage />;
  }
  render(<QueryClientProvider client={client}><Management /></QueryClientProvider>);
  return userEvent.setup();
}

test("DE freezes canonical revision, rejects stale played without retry, and requires a fresh draft", async () => {
  let canonical = canonicalMatch();
  let current = { ...state, matches: [{ ...state.matches[0], status: "ready" as const, score1: null, score2: null }] };
  const writes: Record<string, unknown>[] = [];
  globalThis.fetch = async (_input, init) => {
    writes.push(JSON.parse(String(init?.body)));
    if (writes.length === 1) {
      canonical = { ...canonical, revision: 8, player1Id: 12, player2Id: 11, player1Name: "Bravo", player2Name: "Alpha" };
      return new Response(JSON.stringify({ code: "CONCURRENT_MODIFICATION" }), { status: 409, headers: { "content-type": "application/json" } });
    }
    return new Response("{}", { headers: { "content-type": "application/json" } });
  };
  const user = renderManagement(() => current, () => canonical);
  clients.forEach(client => client.setDefaultOptions({ ...client.getDefaultOptions(), mutations: { retry: 2, gcTime: 0 } }));
  const input = screen.getByRole("spinbutton", { name: "Wynik 1 — Upper 1" });
  await user.clear(input); await user.type(input, "2");
  // Unrelated graph polling must not replace canonical revision 7 with stage revision 99.
  current = { ...current, revision: 99 };
  await act(async () => { await Promise.all([...clients].map(client => client.invalidateQueries())); });
  await user.click(screen.getByRole("button", { name: "Zapisz wynik" }));
  await screen.findByRole("alert");
  await screen.findByText(/Nieaktualny draft: Alpha – Bravo, 2:0/);
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0], { resultType: "played", expectedRevision: 7, score1: 2, score2: 0 });
  assert.match(screen.getByRole("alert").textContent ?? "", /Mecz zmienił się od czasu rozpoczęcia edycji/);
  assert.equal(screen.queryByText("Wynik zapisany. Stan drabinki został odświeżony."), null);
  await waitFor(() => assert.ok(input.matches(":disabled")));
  assert.equal((input as HTMLInputElement).value, "0"); // no remapping of Alpha's score to Bravo
  await waitFor(() => assert.ok(screen.getByRole("button", { name: "Odrzuć wynik roboczy" }).matches(":enabled")));
  await user.click(screen.getByRole("button", { name: "Odrzuć wynik roboczy" }));
  await user.clear(input); await user.type(input, "2");
  await user.click(screen.getByRole("button", { name: "Zapisz wynik" }));
  await screen.findByText("Wynik zapisany. Stan drabinki został odświeżony.");
  assert.equal(writes.length, 2);
  assert.equal(writes[1].expectedRevision, 8);
});

test("DE polling cannot rebase a canonical draft after an ABA change", async () => {
  let canonical = canonicalMatch();
  const current = { ...state, matches: [{ ...state.matches[0], status: "ready" as const }] };
  const user = renderManagement(() => current, () => canonical);
  const input = screen.getByRole("spinbutton", { name: "Wynik 1 — Upper 1" });
  await user.clear(input); await user.type(input, "2");
  canonical = { ...canonical, revision: 9 };
  await act(async () => { await Promise.all([...clients].map(client => client.invalidateQueries())); });
  await waitFor(() => assert.ok(input.matches(":disabled")));
  assert.ok(screen.getByRole("button", { name: "Zapisz wynik" }).matches(":disabled"));
  assert.ok(screen.getByText(/Nieaktualny draft: Alpha – Bravo, 2:0/));
});

test("DE does not transfer a draft to a replacement canonical match with the same bracket key", async () => {
  let canonical = canonicalMatch();
  let current = { ...state, matches: [{ ...state.matches[0], status: "ready" as const }] };
  const user = renderManagement(() => current, () => canonical);
  const input = screen.getByRole("spinbutton", { name: "Wynik 1 — Upper 1" });
  await user.clear(input); await user.type(input, "2");
  canonical = { ...canonical, id: 102, revision: 1 };
  current = { ...current, matches: [{ ...current.matches[0], matchId: 102 }] };
  await act(async () => { await Promise.all([...clients].map(client => client.invalidateQueries())); });
  await waitFor(() => assert.equal((input as HTMLInputElement).value, "0"));
});

test("DE score form preserves input on failure, blocks double submit, and shows refreshed success", async () => {
  let current: DoubleEliminationStageState = { ...state, matches: [{ ...state.matches[0], status: "ready", score1: null, score2: null }] };
  let writes = 0;
  let finish: (response: Response) => void = () => {};
  globalThis.fetch = async (_input, init) => {
    writes++;
    assert.deepEqual(JSON.parse(String(init?.body)), { resultType: "played", expectedRevision: 7, score1: 2, score2: 1 });
    return new Promise<Response>(resolve => { finish = resolve; });
  };
  const user = renderManagement(() => current);
  const a = screen.getByRole("spinbutton", { name: "Wynik 1 — Upper 1" });
  const b = screen.getByRole("spinbutton", { name: "Wynik 2 — Upper 1" });
  await user.clear(a); await user.type(a, "2");
  await user.clear(b); await user.type(b, "1");
  await user.dblClick(screen.getByRole("button", { name: "Zapisz wynik" }));
  assert.equal(writes, 1); assert.ok(a.matches(":disabled"));
  finish(new Response("unavailable", { status: 503 }));
  await screen.findByRole("alert");
  assert.equal((a as HTMLInputElement).value, "2");
  await waitFor(() => assert.equal(a.matches(":disabled"), false));
  await user.click(screen.getByRole("button", { name: "Zapisz wynik" }));
  current = { ...state, matches: [{ ...state.matches[0], score2: 1 }] };
  finish(new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } }));
  await screen.findByText("Wynik zapisany. Stan drabinki został odświeżony.");
  assert.equal(writes, 2);
  assert.ok(screen.getByText("Zapisany wynik: 2:1"));
});

test("DE correction confirms participants, saved result and downstream count before reverting", async () => {
  let current: DoubleEliminationStageState = { ...state, matches: [{ ...state.matches[0], downstreamResultCount: 2 }] };
  let writes = 0;
  let accept = false;
  let confirmation = "";
  window.confirm = message => { confirmation = String(message); return accept; };
  globalThis.fetch = async () => {
    writes++;
    current = { ...current, matches: [{ ...current.matches[0], status: "ready", score1: null, score2: null }] };
    return new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } });
  };
  const user = renderManagement(() => current);
  await user.click(screen.getByRole("button", { name: "Cofnij / skoryguj wynik" }));
  assert.equal(writes, 0);
  assert.match(confirmation, /Alpha – Bravo.*2:0.*2 późniejszych wyników/);
  accept = true;
  await user.click(screen.getByRole("button", { name: "Cofnij / skoryguj wynik" }));
  await screen.findByRole("spinbutton", { name: "Wynik 1 — Upper 1" });
  assert.equal(writes, 1);
  await screen.findByText("Wynik cofnięty. Wpisz poprawny wynik w formularzu tego meczu.");
});
