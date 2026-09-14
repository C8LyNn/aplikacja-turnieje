import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/context/auth-context";
import { getListTournamentsQueryKey } from "@workspace/api-client-react";
import Dashboard from "./dashboard";

const originalFetch = globalThis.fetch;
const clients: QueryClient[] = [];
afterEach(() => {
  cleanup();
  clients.splice(0).forEach(client => client.clear());
  globalThis.fetch = originalFetch;
  localStorage.clear();
  sessionStorage.clear();
});

const tournament = (id: number, name: string) => ({
  id, name, format: "single_elimination", status: "draft", createdAt: "2026-09-14T10:00:00Z",
  hasOrganizerPassword: true, hasHostCode: false, maxPlayers: 8,
});
const tournaments = [tournament(1, "Pierwszy turniej"), tournament(2, "Drugi turniej")];
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json" },
});

function setup(response: () => Response | Promise<Response>) {
  localStorage.setItem("tm_role", "organizer");
  globalThis.fetch = async input => {
    assert.equal(String(input), "/api/tournaments");
    return response();
  };
  const client = new QueryClient({ defaultOptions: {
    queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 },
  } });
  clients.push(client);
  const location = memoryLocation({ path: "/dashboard" });
  render(<QueryClientProvider client={client}><Router hook={location.hook}><AuthProvider><Dashboard /></AuthProvider></Router></QueryClientProvider>);
  return { client, user: userEvent.setup() };
}

test("Dashboard reads the API array and selects the requested deletion target", async () => {
  const { user } = setup(() => json(tournaments));
  await screen.findByText("Pierwszy turniej");
  assert.ok(screen.getByText("Drugi turniej"));
  await user.click(screen.getAllByTitle("Usuń turniej")[1]);
  assert.ok(screen.getByText("„Drugi turniej\""));
  assert.equal(screen.queryByText("„Pierwszy turniej\""), null);
  assert.ok(screen.getByLabelText("Hasło organizatora"));
  await user.click(screen.getByRole("button", { name: "Anuluj" }));
  assert.equal(screen.queryByRole("button", { name: "Usuń na stałe" }), null);
});

test("Dashboard renders an empty API array as an empty list", async () => {
  setup(() => json([]));
  await screen.findByRole("heading", { name: "Brak turniejów" });
  assert.equal(screen.queryByRole("alert"), null);
  assert.equal(screen.queryByTitle("Usuń turniej"), null);
});

test("Dashboard waits for the list without rendering empty or deletion state", async () => {
  let resolve!: (response: Response) => void;
  const pending = new Promise<Response>(done => { resolve = done; });
  setup(() => pending);
  assert.equal(screen.queryByText("Brak turniejów"), null);
  assert.equal(screen.queryByTitle("Usuń turniej"), null);
  await act(async () => { resolve(json(tournaments)); });
  await screen.findByText("Pierwszy turniej");
});

for (const [label, invalidResponse] of [
  // Actual Vite response observed at /api/tournaments without an API proxy.
  ["Vite HTML fallback (200)", () => new Response('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    status: 200, headers: { "content-type": "text/html" },
  })],
  ["API error (503)", () => json({ error: "unavailable" }, 503)],
] as const) {
  test(`Dashboard treats ${label} as a query error and recovers through retry`, async () => {
    let failed = true;
    const { client, user } = setup(() => failed ? invalidResponse() : json(tournaments));
    await screen.findByRole("alert");
    assert.equal(client.getQueryData(getListTournamentsQueryKey()), undefined);
    assert.equal(screen.queryByText("Brak turniejów"), null);
    assert.equal(screen.queryByTitle("Usuń turniej"), null);
    failed = false;
    await user.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
    await screen.findByText("Pierwszy turniej");
    await waitFor(() => assert.equal(screen.queryByRole("alert"), null));
  });
}
