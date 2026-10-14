import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import React, { type ReactNode } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/auth-context";
import {
  isTournamentAuthQuery,
  removeTournamentAuthQueries,
  tournamentIdFromAuthQuery,
} from "./tournament-query-invalidation";

Object.assign(globalThis, { React });
let client: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  sessionStorage.clear();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  cleanup();
  client.clear();
});

test("auth-query matcher isolates tournament ID boundaries (7 vs 70) and routes", () => {
  assert.equal(isTournamentAuthQuery(["/api/tournaments/7"], 7), true);
  assert.equal(isTournamentAuthQuery(["/api/tournaments/7/stages/1"], 7), true);
  assert.equal(isTournamentAuthQuery(["/api/tournaments/7?details=1"], 7), true);
  assert.equal(isTournamentAuthQuery(["/api/tournaments/70/stages"], 7), false);
  assert.equal(isTournamentAuthQuery(["/api/tournaments/8"], 7), false);
  assert.equal(isTournamentAuthQuery(["/api/players/7"], 7), false);
  assert.equal(tournamentIdFromAuthQuery(["/api/tournaments/7/stages"]), 7);
  assert.equal(tournamentIdFromAuthQuery(["/api/tournaments/70"]), 70);
  assert.equal(tournamentIdFromAuthQuery(["/api/tournaments/07"]), null);
});

test("explicit organizer logout removes private tournament A cache, keeps public B", async () => {
  const hook = renderHook(() => useAuth(), { wrapper });
  act(() => hook.result.current.storeOrgToken(7, "organizer-A"));
  client.setQueryData(["/api/tournaments/7"], { visibility: "private_online", privateField: "SECRET A" });
  client.setQueryData(["/api/tournaments/7/stages/1"], { roster: "SECRET A" });
  client.setQueryData(["/api/tournaments/8"], { visibility: "public_online", name: "Public B" });
  act(() => hook.result.current.removeOrgToken(7));
  assert.equal(client.getQueryData(["/api/tournaments/7"]), undefined);
  assert.equal(client.getQueryData(["/api/tournaments/7/stages/1"]), undefined);
  assert.deepEqual(client.getQueryData(["/api/tournaments/8"]), { visibility: "public_online", name: "Public B" });
  assert.equal(hook.result.current.getOrgToken(7), null);
});

test("organizer token A-to-B changes invalidate A-privileged data before the new identity sees it", () => {
  const hook = renderHook(() => useAuth(), { wrapper });
  act(() => hook.result.current.storeOrgToken(7, "token-A"));
  client.setQueryData(["/api/tournaments/7"], { privateField: "A only" });
  act(() => hook.result.current.storeOrgToken(7, "token-B"));
  assert.equal(client.getQueryData(["/api/tournaments/7"]), undefined);
  assert.equal(hook.result.current.getOrgToken(7), "token-B");
});

test("late in-flight private A fetch cannot refill cache after explicit logout", async () => {
  const hook = renderHook(() => useAuth(), { wrapper });
  act(() => hook.result.current.storeOrgToken(7, "token-A"));
  let finishOld!: (value: { privateField: string }) => void;
  const inFlight = client.fetchQuery({
    queryKey: ["/api/tournaments/7/stages"],
    queryFn: () => new Promise<{ privateField: string }>(resolve => { finishOld = resolve; }),
  }).catch(() => undefined);
  await waitFor(() => assert.equal(typeof finishOld, "function"));
  act(() => hook.result.current.removeOrgToken(7));
  finishOld({ privateField: "late SECRET A" });
  await inFlight;
  assert.equal(client.getQueryData(["/api/tournaments/7/stages"]), undefined);
});

test("viewer, support and organizer credentials each invalidate on removal/replacement", () => {
  const hook = renderHook(() => useAuth(), { wrapper });
  const key = ["/api/tournaments/7/matches"] as const;
  act(() => hook.result.current.storeViewerToken(7, "viewer-A"));
  client.setQueryData(key, { privateField: "viewer A" });
  act(() => hook.result.current.storeViewerToken(7, "viewer-B"));
  assert.equal(client.getQueryData(key), undefined);
  client.setQueryData(key, { privateField: "viewer B" });
  act(() => hook.result.current.removeViewerToken(7));
  assert.equal(client.getQueryData(key), undefined);

  act(() => hook.result.current.storeSupSession(7, "support-A", "Support"));
  client.setQueryData(key, { privateField: "support A" });
  act(() => hook.result.current.removeSupSession(7));
  assert.equal(client.getQueryData(key), undefined);
  assert.equal(hook.result.current.getSupSession(7), null);
});

for (const status of [401, 403] as const) {
  test(`denied ${status} read following authorized data evicts only that tournament`, async () => {
    renderHook(() => useAuth(), { wrapper });
    const key = ["/api/tournaments/7"];
    client.setQueryData(key, { visibility: "private_online", privateField: "OLD SECRET" });
    client.setQueryData(["/api/tournaments/8"], { visibility: "public_online", name: "Public B" });
    const error = Object.assign(new Error("denied"), { status });
    await client.fetchQuery({
      queryKey: key,
      staleTime: 0,
      queryFn: async () => { throw error; },
    }).catch(() => undefined);
    assert.equal(client.getQueryData(key), undefined);
    assert.deepEqual(client.getQueryData(["/api/tournaments/8"]), { visibility: "public_online", name: "Public B" });
  });
}

test("manual eviction aborts delayed queries rather than allowing old response repopulation", async () => {
  let complete!: (value: string) => void;
  const old = client.fetchQuery({
    queryKey: ["/api/tournaments/9/standings"],
    queryFn: () => new Promise<string>(resolve => { complete = resolve; }),
  }).catch(() => undefined);
  await waitFor(() => assert.equal(typeof complete, "function"));
  removeTournamentAuthQueries(client, 9);
  complete("OLD SECRET");
  await old;
  assert.equal(client.getQueryData(["/api/tournaments/9/standings"]), undefined);
});
