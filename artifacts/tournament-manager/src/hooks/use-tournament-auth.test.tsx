import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import React, { type ReactNode } from "react";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import {
  setActiveOrganizerToken,
  setActiveSupportToken,
} from "@workspace/api-client-react";
import { TestAuthProvider as AuthProvider } from "../../test/auth-provider";
import { getSupportSession, setSupportSession } from "@/lib/auth";
import { deriveOrganizerCapabilities, NO_ORGANIZER_CAPABILITIES } from "@/lib/organizer-capabilities";
import { useSyncTournamentAuth } from "./use-tournament-auth";

const originalFetch = globalThis.fetch;
Object.assign(globalThis, { React });
const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

beforeEach(() => {
  sessionStorage.clear();
  setActiveOrganizerToken(null);
  setActiveSupportToken(null);
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  setActiveOrganizerToken(null);
  setActiveSupportToken(null);
});

test("a stored but invalid support session never grants mutating capabilities", async () => {
  setSupportSession(41, "expired-support-token", "Support");
  globalThis.fetch = (async () => new Response(
    JSON.stringify({ error: "Sesja wygasła" }),
    { status: 403, headers: { "content-type": "application/json" } },
  )) as typeof fetch;

  const result = renderHook(() => useSyncTournamentAuth(41), { wrapper });
  assert.equal(result.result.current.supSession, null);
  assert.equal(result.result.current.isAuthenticated, false);
  assert.equal(result.result.current.isReady, false);

  await waitFor(() => assert.equal(result.result.current.isReady, true));
  assert.equal(getSupportSession(41), null);
  assert.deepEqual(
    deriveOrganizerCapabilities({
      role: "support",
      tournament: { hasHostCode: false, hasOrganizerPassword: true },
      hasOrganizerToken: false,
      hasSupportSession: !!result.result.current.supSession,
    }),
    NO_ORGANIZER_CAPABILITIES,
  );
});

test("a late support verification cannot authenticate a different tournament", async () => {
  setSupportSession(41, "support-a", "Support A");
  setSupportSession(42, "support-b", "Support B");
  let resolveA!: (response: Response) => void;
  let resolveB!: (response: Response) => void;
  globalThis.fetch = ((input) => {
    const url = String(input);
    if (url.includes("/41/")) {
      return new Promise<Response>((resolve) => { resolveA = resolve; });
    }
    return new Promise<Response>((resolve) => { resolveB = resolve; });
  }) as typeof fetch;

  const result = renderHook(
    ({ tournamentId }) => useSyncTournamentAuth(tournamentId),
    { initialProps: { tournamentId: 41 }, wrapper },
  );
  await waitFor(() => assert.equal(typeof resolveA, "function"));
  result.rerender({ tournamentId: 42 });
  await waitFor(() => assert.equal(typeof resolveB, "function"));

  resolveA(new Response(null, { status: 200 }));
  await Promise.resolve();
  assert.equal(result.result.current.isReady, false);
  assert.equal(result.result.current.supSession, null);

  resolveB(new Response(JSON.stringify({ error: "Sesja wygasła" }), {
    status: 403,
    headers: { "content-type": "application/json" },
  }));
  await waitFor(() => assert.equal(result.result.current.isReady, true));
  assert.equal(result.result.current.isAuthenticated, false);
  assert.equal(getSupportSession(42), null);
});
