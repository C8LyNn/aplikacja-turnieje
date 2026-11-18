import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Match } from "@workspace/api-client-react";
import { TwoLegTieEditor, TwoLegTieSummary } from "./two-leg-tie";
import { setRulesOf, tieLegRows, tieRowLegs, tieScoreText, tieSentence } from "@/lib/two-leg-tie-view";

const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });

type LegInput = { status: "pending" | "completed"; score1: number | null; score2: number | null; scheduledAt?: string | null };
function tie(leg1: LegInput, leg2: LegInput, extra: Partial<Match> = {}, tieExtra: Partial<NonNullable<Match["tie"]>> = {}): Match {
  const legs = [leg1, leg2].map((leg, index) => ({
    leg: (index + 1) as 1 | 2, homeSide: (index + 1) as 1 | 2, status: leg.status, score1: leg.score1, score2: leg.score2,
    scheduledAt: leg.scheduledAt ?? null, completedAt: leg.status === "completed" ? "2026-11-20T20:00:00.000Z" : null, revision: leg.status === "completed" ? 2 : 1,
  }));
  const done = legs.filter((leg) => leg.status === "completed");
  const total1 = done.reduce((sum, leg) => sum + (leg.score1 ?? 0), 0);
  const total2 = done.reduce((sum, leg) => sum + (leg.score2 ?? 0), 0);
  const state = done.length === 0 ? "not_started" : done.length === 1 ? "first_leg_played" : total1 === total2 ? "awaiting_decision" : "decided";
  return {
    id: 41, revision: 3, tournamentId: 1, stageId: 2, stageGroupId: null, round: 1, matchNumber: 1,
    player1Id: 10, player2Id: 11, player1Name: "Wilki", player2Name: "Orły", score1: null, score2: null, winnerId: null,
    bestOf: 1, resultType: null, resultReason: null, status: done.length ? "in_progress" : "pending", nextMatchId: null, sortOrder: null,
    scheduledAt: null, completedAt: null, routingMatchKey: null, sets: null,
    legs, tie: { state, total1, total2, completedLegs: done.length, decidedBy: null, decisionReason: null, decisionWinnerId: null, ...tieExtra },
    ...extra,
  } as Match;
}

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } });

test("view helpers: home side first per leg, the aggregate sentence, bracket rows, and only set rules count as sets", () => {
  const match = tie({ status: "completed", score1: 2, score2: 1 }, { status: "completed", score1: 1, score2: 3 }, { status: "completed", score1: 3, score2: 4, winnerId: 11 }, { state: "decided", decidedBy: "aggregate" });
  const rows = tieLegRows(match);
  assert.deepEqual(rows.map((row) => `${row.label}: ${row.homeName} ${row.homeScore}:${row.awayScore} ${row.awayName}`), [
    "1. spotkanie: Wilki 2:1 Orły",
    "2. spotkanie: Orły 3:1 Wilki",
  ]);
  assert.equal(tieSentence(match), "Łącznie 3:4 — awansuje Orły.");
  assert.equal(tieRowLegs(match, 1), "2·1");
  assert.equal(tieRowLegs(match, 2), "1·3");
  assert.equal(tieScoreText(match), "3:4");
  assert.equal(setRulesOf({ kind: "two_legs" }), null);
  assert.deepEqual(setRulesOf({ kind: "sets", setsToWin: 2 }), { kind: "sets", setsToWin: 2 });
});

test("summary: a viewer sees both legs with the host first, the unplayed date, and what the aggregate means", () => {
  render(<TwoLegTieSummary match={tie({ status: "completed", score1: 2, score2: 1 }, { status: "pending", score1: null, score2: null, scheduledAt: "2026-12-05T17:00:00.000Z" })} />);
  const summary = screen.getByTestId("two-leg-tie-summary");
  assert.match(summary.textContent ?? "", /Po pierwszym spotkaniu/);
  assert.match(summary.textContent ?? "", /1\. spotkanieWilki 2:1 Orły/);
  assert.match(summary.textContent ?? "", /2\. spotkanieOrły –:– Wilki/);
  assert.match(screen.getByTestId("two-leg-tie-total").textContent ?? "", /Łącznie 2:1 po pierwszym spotkaniu — prowadzi Wilki/);
});

test("editor: the second leg is typed home first (Orły 3:1 Wilki) and stored in the tie's orientation (1:3)", async () => {
  const user = userEvent.setup();
  const calls: Array<{ url: string; body: unknown }> = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), body: init?.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify(tie({ status: "completed", score1: 2, score2: 1 }, { status: "completed", score1: 1, score2: 3 })), { status: 200, headers: { "content-type": "application/json" } });
  };
  let refreshed = 0;
  render(<QueryClientProvider client={client()}><TwoLegTieEditor match={tie({ status: "completed", score1: 2, score2: 1 }, { status: "pending", score1: null, score2: null })} canWrite onChanged={() => { refreshed += 1; }} /></QueryClientProvider>);
  const leg2 = screen.getByTestId("two-leg-2");
  await user.click(within(leg2).getByRole("button", { name: "Dodaj: 2. spotkanie, Orły" }));
  await user.click(within(leg2).getByRole("button", { name: "Dodaj: 2. spotkanie, Orły" }));
  await user.click(within(leg2).getByRole("button", { name: "Dodaj: 2. spotkanie, Orły" }));
  await user.click(within(leg2).getByRole("button", { name: "Dodaj: 2. spotkanie, Wilki" }));
  await user.click(within(leg2).getByRole("button", { name: /Zapisz wynik: 2\. spotkanie/ }));
  const save = calls.find((call) => call.url.endsWith("/api/matches/41/legs/2/result"));
  assert.ok(save, JSON.stringify(calls));
  assert.deepEqual(save!.body, { score1: 1, score2: 3, expectedRevision: 1 });
  assert.ok(refreshed >= 1);
  assert.ok(screen.getAllByRole("status").some((node) => /Zapisano: 2\. spotkanie Orły 3:1 Wilki\./.test(node.textContent ?? "")), "the confirmation reads home first");
});

test("editor: a level aggregate asks the organizer for the winner and a reason; nothing is sent without both", async () => {
  const user = userEvent.setup();
  const calls: Array<{ url: string; body: unknown }> = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), body: init?.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } });
  };
  render(<QueryClientProvider client={client()}><TwoLegTieEditor match={tie({ status: "completed", score1: 1, score2: 1 }, { status: "completed", score1: 2, score2: 2 })} canWrite onChanged={() => {}} /></QueryClientProvider>);
  const decision = screen.getByTestId("two-leg-tie-decision");
  assert.match(decision.textContent ?? "", /nie wymyśla wyniku dogrywki ani rzutów karnych/);
  const confirm = within(decision).getByRole("button", { name: "Zatwierdź awans" }) as HTMLButtonElement;
  assert.equal(confirm.disabled, true, "needs a winner and a reason");
  await user.click(within(decision).getByLabelText("Orły"));
  assert.equal(confirm.disabled, true);
  await user.type(within(decision).getByLabelText(/Powód rozstrzygnięcia/), "Rzuty karne 4:3");
  assert.equal(confirm.disabled, false);
  await user.click(confirm);
  const sent = calls.find((call) => call.url.endsWith("/api/matches/41/tie-decision"));
  assert.deepEqual(sent?.body, { winnerId: 11, reason: "Rzuty karne 4:3", expectedRevision: 3 });
  assert.match(screen.getByTestId("two-leg-tie-total").textContent ?? "", /remis w sumie; czeka na rozstrzygnięcie organizatora, awans wstrzymany/);
});

test("editor: correcting a played leg asks first and explains the effect on advancement", async () => {
  const user = userEvent.setup();
  const calls: string[] = [];
  globalThis.fetch = async (input) => { calls.push(String(input)); return new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } }); };
  const decided = tie({ status: "completed", score1: 2, score2: 1 }, { status: "completed", score1: 1, score2: 3 }, { status: "completed", score1: 3, score2: 4, winnerId: 11 }, { state: "decided", decidedBy: "aggregate" });
  render(<QueryClientProvider client={client()}><TwoLegTieEditor match={decided} canWrite onChanged={() => {}} /></QueryClientProvider>);
  await user.click(within(screen.getByTestId("two-leg-2")).getByRole("button", { name: "Popraw wynik spotkania" }));
  const dialog = screen.getByRole("alertdialog", { name: "Potwierdź cofnięcie wyniku spotkania" });
  assert.match(dialog.textContent ?? "", /awans zostanie cofnięty, jeśli następny mecz jeszcze się nie zaczął/);
  assert.equal(calls.length, 0, "nothing is sent before confirming");
  await user.click(within(dialog).getByRole("button", { name: "Cofnij wynik spotkania" }));
  assert.ok(calls.some((url) => url.endsWith("/api/matches/41/legs/2/revert")));
});

test("editor: viewers and support without result rights see the legs but no inputs", () => {
  render(<QueryClientProvider client={client()}><TwoLegTieEditor match={tie({ status: "pending", score1: null, score2: null }, { status: "pending", score1: null, score2: null })} canWrite={false} onChanged={() => {}} /></QueryClientProvider>);
  assert.equal(screen.queryAllByRole("spinbutton").length, 0);
  assert.equal(screen.queryByRole("button", { name: /Zapisz wynik/ }), null);
});
