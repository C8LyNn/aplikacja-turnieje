import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { setActiveHostCode } from "@workspace/api-client-react";
import { useHostAuth } from "./use-host-auth";

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  sessionStorage.clear();
  setActiveHostCode(null);
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  setActiveHostCode(null);
});

test("a verified legacy host remains verified after Host to Detail remount", async () => {
  const requests: string[] = [];
  globalThis.fetch = (async (input) => {
    requests.push(String(input));
    return jsonResponse({ valid: true });
  }) as typeof fetch;

  const host = renderHook(() => useHostAuth(41, true));
  await act(async () => {
    assert.equal(await host.result.current.authenticate("legacy-A"), true);
  });
  host.unmount();

  const detail = renderHook(() => useHostAuth(41, true));
  assert.equal(detail.result.current.isAuthenticated, false);
  assert.equal(detail.result.current.isReady, false);
  await waitFor(() => assert.equal(detail.result.current.isAuthenticated, true));
  assert.equal(requests.every((url) => url.endsWith("/api/tournaments/41/verify-host-code")), true);
});

test("a stored code is scoped to its tournament and is not trusted for another", async () => {
  sessionStorage.setItem("hostCode_41", "legacy-A");
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return jsonResponse({ valid: true });
  }) as typeof fetch;
  const result = renderHook(() => useHostAuth(42, true));
  await waitFor(() => assert.equal(result.result.current.isReady, true));
  assert.equal(result.result.current.isAuthenticated, false);
  assert.equal(calls, 0);
});

test("an invalid stored code is removed and grants no capability", async () => {
  sessionStorage.setItem("hostCode_41", "bad");
  globalThis.fetch = (async () => jsonResponse({ valid: false })) as typeof fetch;
  const result = renderHook(() => useHostAuth(41, true));
  await waitFor(() => assert.equal(result.result.current.isReady, true));
  assert.equal(result.result.current.isAuthenticated, false);
  assert.equal(sessionStorage.getItem("hostCode_41"), null);
});

test("verification in progress never grants privileged state", async () => {
  sessionStorage.setItem("hostCode_41", "pending");
  globalThis.fetch = (() => new Promise<Response>(() => undefined)) as typeof fetch;
  const result = renderHook(() => useHostAuth(41, true));
  assert.equal(result.result.current.isReady, false);
  assert.equal(result.result.current.isAuthenticated, false);
  result.unmount();
});

test("a late manual verification for tournament A cannot authenticate tournament B", async () => {
  let resolveA: ((response: Response) => void) | undefined;
  globalThis.fetch = ((input) => {
    if (!String(input).endsWith("/api/tournaments/41/verify-host-code")) {
      return Promise.resolve(jsonResponse({ valid: false }));
    }
    return new Promise<Response>((resolve) => {
      resolveA = resolve;
    });
  }) as typeof fetch;

  const result = renderHook(
    ({ tournamentId }) => useHostAuth(tournamentId, true),
    { initialProps: { tournamentId: 41 } },
  );
  let verification!: Promise<boolean>;
  act(() => {
    verification = result.result.current.authenticate("legacy-A");
  });
  result.rerender({ tournamentId: 42 });
  await act(async () => {
    resolveA?.(jsonResponse({ valid: true }));
    assert.equal(await verification, false);
  });

  assert.equal(result.result.current.isAuthenticated, false);
  assert.equal(sessionStorage.getItem("hostCode_41"), null);
  assert.equal(sessionStorage.getItem("hostCode_42"), null);
});
