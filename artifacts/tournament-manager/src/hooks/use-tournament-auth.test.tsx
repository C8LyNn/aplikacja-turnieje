import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import React, { type ReactNode } from "react";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import {
  setActiveOrganizerToken,
  setActiveSupportToken,
} from "@workspace/api-client-react";
import { AuthProvider } from "@/context/auth-context";
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
