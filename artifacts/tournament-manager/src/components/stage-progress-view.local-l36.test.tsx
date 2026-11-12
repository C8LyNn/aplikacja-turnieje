import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestAuthProvider as AuthProvider } from "../../test/auth-provider";
import { StageProgressView } from "./stage-progress-view";

const originalFetch = globalThis.fetch;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json" },
});
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });

test("L36: first failed stage read shows failure, not 'Brak drabinki', and retry works", async () => {
  let attempts = 0;
  globalThis.fetch = async () => (++attempts === 1 ? json({ error: "Serwer niedostępny" }, 503) : json([]));
  render(<AuthProvider><StageProgressView tournamentId={71} matches={[]} /></AuthProvider>);
  assert.ok((await screen.findByRole("alert")).textContent?.includes("Nie udało się pobrać listy etapów"));
  assert.equal(screen.queryByText("Brak drabinki. Wystartuj turniej."), null);
  await userEvent.click(screen.getByRole("button", { name: "Ponów odczyt etapów" }));
  assert.ok(await screen.findByText("Brak drabinki. Wystartuj turniej."));
  assert.equal(attempts, 2);
});

test("L36: successful empty stage list retains expected empty state", async () => {
  globalThis.fetch = async () => json([]);
  render(<AuthProvider><StageProgressView tournamentId={72} matches={[]} /></AuthProvider>);
  assert.ok(await screen.findByText("Brak drabinki. Wystartuj turniej."));
  assert.equal(screen.queryByRole("alert"), null);
});
