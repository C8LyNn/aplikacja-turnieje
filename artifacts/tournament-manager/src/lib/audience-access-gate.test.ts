/**
 * Regression tests for the audience password-gate latch.
 *
 * Root cause of the bug: useGetTournament runs with refetchInterval=4000.
 * While a background refetch is in-flight, React Query temporarily clears
 * `tournamentError`, making `accessDeniedCode` undefined for the duration of
 * the HTTP round-trip. Without the latch, the password gate unmounts every 4 s,
 * resetting the modal, erasing typed text, and causing a loading flash.
 *
 * The fix: a `useRef` latch that holds the last seen access-denied code and only
 * clears it when the query actually succeeds (tournament data becomes available).
 *
 * These tests verify the latch state machine in isolation (no React needed).
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

/**
 * Pure model of the ref-latch logic used in tournament-audience.tsx.
 * Mirrors the in-render update:
 *   if (rawAccessDeniedCode) ref.current = rawAccessDeniedCode;
 *   else if (tournament) ref.current = undefined;
 */
function applyLatch(
  current: string | undefined,
  rawAccessDeniedCode: string | undefined,
  tournament: object | undefined,
): string | undefined {
  if (rawAccessDeniedCode) return rawAccessDeniedCode;
  if (tournament) return undefined;
  return current; // neither error nor success — keep existing latch
}

describe("audience access-gate latch state machine", () => {
  test("private_online without viewer session shows password gate on first error", () => {
    const latched = applyLatch(undefined, "VIEWER_PASSWORD_REQUIRED", undefined);
    assert.equal(latched, "VIEWER_PASSWORD_REQUIRED");
  });

  test("background refetch (error briefly cleared) does NOT remove password gate", () => {
    // Step 1 — initial error → latch set
    let latched = applyLatch(undefined, "VIEWER_PASSWORD_REQUIRED", undefined);
    assert.equal(latched, "VIEWER_PASSWORD_REQUIRED");

    // Step 2 — refetch starts, React Query clears error temporarily (rawCode = undefined)
    latched = applyLatch(latched, undefined, undefined);
    assert.equal(latched, "VIEWER_PASSWORD_REQUIRED", "latch must survive temporary error clearance");
  });

  test("latch stays stable across multiple refetch cycles", () => {
    let latched = applyLatch(undefined, "VIEWER_PASSWORD_REQUIRED", undefined);

    for (let cycle = 0; cycle < 5; cycle++) {
      // error cleared during refetch
      latched = applyLatch(latched, undefined, undefined);
      assert.equal(latched, "VIEWER_PASSWORD_REQUIRED", `cycle ${cycle}: gate must not disappear`);
      // error returns after failed refetch
      latched = applyLatch(latched, "VIEWER_PASSWORD_REQUIRED", undefined);
      assert.equal(latched, "VIEWER_PASSWORD_REQUIRED", `cycle ${cycle}: gate must reappear`);
    }
  });

  test("latch clears only when tournament query succeeds (correct viewer session)", () => {
    // Start from locked state
    let latched = applyLatch(undefined, "VIEWER_PASSWORD_REQUIRED", undefined);
    assert.equal(latched, "VIEWER_PASSWORD_REQUIRED");

    // Error cleared during refetch
    latched = applyLatch(latched, undefined, undefined);
    assert.equal(latched, "VIEWER_PASSWORD_REQUIRED");

    // Query succeeds after correct password — tournament data arrives
    latched = applyLatch(latched, undefined, { id: 1, name: "Test" });
    assert.equal(latched, undefined, "latch must clear when tournament loads successfully");
  });

  test("non-viewer-password access-denied codes are also latched (e.g. SUPPORT_ONLY)", () => {
    let latched = applyLatch(undefined, "SUPPORT_ONLY", undefined);
    assert.equal(latched, "SUPPORT_ONLY");

    // Refetch temporarily clears the error
    latched = applyLatch(latched, undefined, undefined);
    assert.equal(latched, "SUPPORT_ONLY", "non-viewer codes must also survive refetch");
  });

  test("no error and no tournament (initial loading) → latch stays undefined", () => {
    const latched = applyLatch(undefined, undefined, undefined);
    assert.equal(latched, undefined, "initial loading state must not trigger gate");
  });
});
