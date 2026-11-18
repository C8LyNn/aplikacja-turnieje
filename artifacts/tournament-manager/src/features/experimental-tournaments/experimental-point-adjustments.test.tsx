import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ExperimentalPointAdjustments } from "./experimental-point-adjustments";

const originalFetch = globalThis.fetch;
const clients = new Set<QueryClient>();
afterEach(() => { cleanup(); clients.forEach((client) => client.clear()); clients.clear(); globalThis.fetch = originalFetch; });

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const stage = { id: 5, tournamentId: 1, name: "Liga", format: "round_robin", status: "active", position: 1, leagueRules: { allowDraws: true } } as never;
const live = { stageId: 5, format: "round_robin", status: "active", final: false, leagueRules: {}, rulesSummary: null, advancingPlaces: null, tables: [{ groupId: null, label: "Liga", matchesPlayed: 1, matchesTotal: 3, rows: [
  { playerId: 11, playerName: "Orły", rank: 1, played: 1, wins: 1, draws: 0, losses: 0, points: 3, scoreFor: 2, scoreAgainst: 0, diff: 2, buchholz: null, decidedBy: null, zone: null, pointAdjustment: 0 },
  { playerId: 12, playerName: "Lwy", rank: 2, played: 1, wins: 0, draws: 0, losses: 1, points: 0, scoreFor: 0, scoreAgainst: 2, diff: -2, buchholz: null, decidedBy: null, zone: null, pointAdjustment: 0 },
] }] };

function mount(locked = false, failFirstPost = false) {
  let failed = false;
  const calls: Array<{ url: string; method: string; body: unknown }> = [];
  let entries = [{ id: "11111111-1111-4111-8111-111111111111", playerId: 12, points: -3, reason: "Spóźnienie", createdAt: "2026-11-18T10:00:00.000Z", revokedAt: null as string | null }];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method, body });
    if (url.endsWith("/standings")) return json(live);
    if (url.endsWith("/revoke")) { entries = entries.map((entry) => ({ ...entry, revokedAt: "2026-11-18T11:00:00.000Z" })); return json({ entries, totals: [] }); }
    if (url.endsWith("/point-adjustments") && method === "POST" && failFirstPost && !failed) {
      failed = true;
      throw new TypeError("Failed to fetch");
    }
    if (url.endsWith("/point-adjustments") && method === "POST") {
      entries = [...entries, { id: "22222222-2222-4222-8222-222222222222", playerId: body.playerId, points: body.points, reason: body.reason, createdAt: "2026-11-18T12:00:00.000Z", revokedAt: null }];
      return json({ entries, totals: [] }, 201);
    }
    if (url.endsWith("/point-adjustments")) return json({ supported: true, locked, entries, totals: [] });
    return json({ error: "unexpected" }, 404);
  }) as typeof fetch;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, refetchInterval: false }, mutations: { retry: false, gcTime: 0 } } });
  clients.add(client);
  render(<QueryClientProvider client={client}><ExperimentalPointAdjustments tournamentId={1} stage={stage} /></QueryClientProvider>);
  return calls;
}

test("lists entries with names, adds a penalty with a reason and revokes one", async () => {
  const calls = mount();
  fireEvent.click(await screen.findByRole("button", { name: /Korekty punktów/ }));
  await screen.findByText(/Spóźnienie/);
  assert.ok(screen.getAllByText("Lwy").length >= 1, "entry shows the participant name");
  await waitFor(() => assert.ok(screen.getByRole("option", { name: "Orły" })));
  fireEvent.change(screen.getByLabelText(/Uczestnik/), { target: { value: "11" } });
  fireEvent.click(screen.getByRole("button", { name: "Mniej punktów" }));
  fireEvent.change(screen.getByLabelText(/Powód/), { target: { value: "Walkower bez zgłoszenia" } });
  fireEvent.click(screen.getByRole("button", { name: "Dodaj korektę" }));
  await screen.findByText(/Dodano korektę -2 pkt/);
  const post = calls.find((call) => call.method === "POST" && call.url.endsWith("/point-adjustments"))!;
  const { requestId, ...sent } = post.body as Record<string, unknown>;
  assert.deepEqual(sent, { playerId: 11, points: -2, reason: "Walkower bez zgłoszenia" });
  assert.match(String(requestId), /^[0-9a-f]{24}$/, "every submission carries an idempotency key");
  fireEvent.click(screen.getAllByRole("button", { name: /Cofnij korektę/ })[0]);
  await screen.findByText("Korekta cofnięta.");
  assert.ok(calls.some((call) => call.url.endsWith("/revoke")));
});

test("a completed stage is read-only", async () => {
  mount(true);
  fireEvent.click(await screen.findByRole("button", { name: /Korekty punktów/ }));
  await screen.findByText(/Spóźnienie/);
  assert.equal(screen.queryByRole("button", { name: "Dodaj korektę" }), null);
  assert.equal(screen.queryByRole("button", { name: /Cofnij korektę/ }), null);
  assert.ok(screen.getByText(/etap zakończony/));
});

test("a network error keeps the form; the retry reuses the same key so the API cannot count it twice", async () => {
  const calls = mount(false, true);
  fireEvent.click(await screen.findByRole("button", { name: /Korekty punktów/ }));
  await waitFor(() => assert.ok(screen.getByRole("option", { name: "Orły" })));
  fireEvent.change(screen.getByLabelText(/Uczestnik/), { target: { value: "11" } });
  fireEvent.change(screen.getByLabelText(/Powód/), { target: { value: "Spóźnienie na mecz" } });
  fireEvent.click(screen.getByRole("button", { name: "Dodaj korektę" }));
  await screen.findByRole("alert");
  assert.equal((screen.getByLabelText(/Powód/) as HTMLInputElement).value, "Spóźnienie na mecz", "input survives the error");
  fireEvent.click(screen.getByRole("button", { name: "Dodaj korektę" }));
  await screen.findByText(/Dodano korektę/);
  const posts = calls.filter((call) => call.method === "POST" && call.url.endsWith("/point-adjustments"));
  assert.equal(posts.length, 2);
  assert.equal((posts[0].body as { requestId: string }).requestId, (posts[1].body as { requestId: string }).requestId);
});
