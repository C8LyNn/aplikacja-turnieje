import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { TestAuthProvider } from "../../test/auth-provider";
import FanView from "./fan-view";

const originalFetch = globalThis.fetch;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; sessionStorage.clear(); localStorage.clear(); });

test("L23: failed initial query is not reported as an empty tournament list, retry succeeds", async () => {
  let calls = 0;
  globalThis.fetch = async (input) => {
    if (!new URL(String(input), "http://localhost").pathname.endsWith("/api/tournaments")) return json({}, 404);
    calls++;
    return calls === 1 ? json({ error: "Błąd serwera" }, 503) : json([]);
  };
  const loc = memoryLocation({ path: "/fan" });
  render(<TestAuthProvider><Router hook={loc.hook} searchHook={loc.searchHook}><FanView /></Router></TestAuthProvider>);
  const alert = await screen.findByRole("alert");
  assert.match(alert.textContent ?? "", /Nie udało się pobrać listy turniejów/);
  assert.equal(screen.queryByText("Brak turniejów do oglądania"), null);
  await userEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
  await screen.findByText("Brak turniejów do oglądania");
  await waitFor(() => assert.equal(calls, 2));
});
