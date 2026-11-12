import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { TournamentQualificationRoutingPanel } from "./tournament-qualification-routing-panel";

const originalFetch = globalThis.fetch;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json" },
});
const routing = {
  version: 1, advisory: true, flowAuthority: "basket_v1", state: "ready",
  title: "Stan routingu", description: "Podgląd kwalifikacji",
  proposalFingerprintRevalidated: false,
  summary: { sourceStages: 1, proposalsPending: 0, proposalsApproved: 1, routesTotal: 1, routesMaterialized: 0 },
  issues: [], qualificationStages: [],
};
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const location = memoryLocation({ path: "/tournaments/71", record: true });
  render(<QueryClientProvider client={client}><Router hook={location.hook}>
    <TournamentQualificationRoutingPanel tournamentId={71} enabled />
  </Router></QueryClientProvider>);
  return client;
}

test("L37: first routing error has retry and does not claim there are no routes", async () => {
  let requests = 0;
  globalThis.fetch = async () => (++requests === 1 ? json({ error: "Offline" }, 503) : json(routing));
  mount();
  assert.ok((await screen.findByRole("alert")).textContent?.includes("nie oznacza braku tras"));
  await userEvent.click(screen.getByRole("button", { name: "Ponów odczyt kwalifikacji" }));
  assert.ok(await screen.findByText("Stan routingu"));
  assert.equal(requests, 2);
});

test("L37: failed refresh retains marked last-known routing snapshot", async () => {
  let requests = 0;
  globalThis.fetch = async () => (++requests === 1 ? json(routing) : json({ error: "Offline" }, 503));
  const client = mount();
  assert.ok(await screen.findByText("Stan routingu"));
  await client.invalidateQueries({ queryKey: ["tournament", 71, "qualification-routing-preview"] });
  await waitFor(() => assert.ok(screen.getByRole("status").textContent?.includes("ostatnio dostępne dane")));
  assert.ok(screen.getByText("Stan routingu"));
  assert.equal(requests, 2);
});
