import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import React, { type ReactNode } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { getListMatchesQueryKey } from "@workspace/api-client-react";
import { getPlayerBansQueryKey, getMatchGamePicksQueryKey, useMatchGamePicks } from "./deadlock-bans-picks";
import {
  isTournamentAuthQuery,
  getVerifiedMatchTournamentOwner,
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


test("active React Query observer no longer renders private A after logout or navigation to B", async () => {
  const result = renderHook(({ id }: { id: number }) => {
    const auth = useAuth();
    const read = useQuery({
      queryKey: ["/api/tournaments/" + id],
      queryFn: async () => ({ privateField: "unexpected network data" }),
      enabled: false,
    });
    return { auth, data: read.data };
  }, { initialProps: { id: 7 }, wrapper });

  act(() => result.result.current.auth.storeOrgToken(7, "token-A"));
  act(() => {
    client.setQueryData(["/api/tournaments/7"], { privateField: "SECRET A" });
    client.setQueryData(["/api/tournaments/8"], { privateField: "authorized B" });
  });
  await waitFor(() => assert.equal(result.result.current.data?.privateField, "SECRET A"));
  act(() => result.result.current.auth.removeOrgToken(7));
  await waitFor(() => assert.equal(result.result.current.data, undefined));
  result.rerender({ id: 8 });
  await waitFor(() => assert.equal(result.result.current.data?.privateField, "authorized B"));
  assert.equal(client.getQueryData(["/api/tournaments/7"]), undefined);
});

/* R17 S2B targeted negative contracts; tests added before production fix. */
const aPicks = getMatchGamePicksQueryKey(701);
const bPicks = getMatchGamePicksQueryKey(801);
const aBans = getPlayerBansQueryKey(7);
const bBans = getPlayerBansQueryKey(8);
const seedOwnership = () => {
  // A trusted, already-authorized tournament-scoped match-list response;
  // matchId and tournamentId are deliberately different.
  client.setQueryData(getListMatchesQueryKey(7), [{ id: 701, tournamentId: 7 }]);
  client.setQueryData(getListMatchesQueryKey(8), [{ id: 801, tournamentId: 8 }]);
};

test("S2B N1: logout evicts A noncanonical bans and owned picks but keeps B", () => {
  const hook = renderHook(() => useAuth(), { wrapper });
  act(() => hook.result.current.storeOrgToken(7, "synthetic-a"));
  seedOwnership();
  client.setQueryData(aBans, [{ playerId: 71, tournamentId: 7, bannedHeroIds: ["fictional-a"] }]);
  client.setQueryData(bBans, [{ playerId: 81, tournamentId: 8, bannedHeroIds: ["fictional-b"] }]);
  client.setQueryData(aPicks, [{ matchId: 701, gameNumber: 1, player1HeroId: "fictional-a" }]);
  client.setQueryData(bPicks, [{ matchId: 801, gameNumber: 1, player1HeroId: "fictional-b" }]);
  act(() => hook.result.current.removeOrgToken(7));
  assert.equal(client.getQueryData(aBans), undefined);
  assert.equal(client.getQueryData(aPicks), undefined);
  assert.equal(client.getQueryData(getListMatchesQueryKey(7)), undefined);
  assert.equal(client.getQueryData(getListMatchesQueryKey(8)) instanceof Array, true);
  assert.equal(client.getQueryData(bBans) instanceof Array, true);
  assert.equal(client.getQueryData(bPicks) instanceof Array, true);
});

test("S2B N1: revoked 403 bans read evicts A tuple cache and leaves public B", async () => {
  renderHook(() => useAuth(), { wrapper });
  client.setQueryData(aBans, [{ tournamentId: 7, bannedHeroIds: ["stale-a"] }]);
  client.setQueryData(bBans, [{ tournamentId: 8, bannedHeroIds: ["public-b"] }]);
  await client.fetchQuery({
    queryKey: aBans, staleTime: 0,
    queryFn: async () => { throw Object.assign(new Error("denied"), { status: 403 }); },
  }).catch(() => undefined);
  assert.equal(client.getQueryData(aBans), undefined);
  assert.ok(client.getQueryData(bBans));
});

test("S2B N2: denied 403 owned game-picks read evicts only A's match key", async () => {
  renderHook(() => useAuth(), { wrapper });
  seedOwnership();
  client.setQueryData(aPicks, [{ matchId: 701, player1HeroId: "stale-a" }]);
  client.setQueryData(bPicks, [{ matchId: 801, player1HeroId: "valid-b" }]);
  await client.fetchQuery({
    queryKey: aPicks, staleTime: 0,
    queryFn: async () => { throw Object.assign(new Error("denied"), { status: 403 }); },
  }).catch(() => undefined);
  assert.equal(client.getQueryData(aPicks), undefined);
  assert.ok(client.getQueryData(bPicks));
});

test("S2B N2: late non-abortable A picks response cannot reinsert after logout", async () => {
  const auth = renderHook(() => useAuth(), { wrapper });
  act(() => auth.result.current.storeOrgToken(7, "synthetic-a"));
  seedOwnership();
  let finish!: (v: { matchId: number; player1HeroId: string }[]) => void;
  const pending = client.fetchQuery({
    queryKey: aPicks,
    queryFn: () => new Promise<{ matchId: number; player1HeroId: string }[]>(resolve => { finish = resolve; }),
  }).catch(() => undefined);
  await waitFor(() => assert.equal(typeof finish, "function"));
  act(() => auth.result.current.removeOrgToken(7));
  finish([{ matchId: 701, player1HeroId: "late-old-a" }]);
  await pending;
  assert.equal(client.getQueryData(aPicks), undefined);
});

test("S2B N2: do not purge unknown-ownership match keys or another tournament", () => {
  const auth = renderHook(() => useAuth(), { wrapper });
  act(() => auth.result.current.storeOrgToken(7, "synthetic-a"));
  client.setQueryData(aPicks, [{ matchId: 701, player1HeroId: "ownership-not-proven" }]);
  client.setQueryData(bPicks, [{ matchId: 801, player1HeroId: "valid-b" }]);
  act(() => auth.result.current.removeOrgToken(7));
  // No trusted tournament-scoped match list exists, therefore no
  // affirmative attribution. Escalate this residual instead of global purge.
  assert.ok(client.getQueryData(aPicks));
  assert.ok(client.getQueryData(bPicks));
});

test("S2B N1: strict tournament tuple scope 7 versus 70 and 8", () => {
  assert.equal(isTournamentAuthQuery(getPlayerBansQueryKey(7), 7), true);
  assert.equal(isTournamentAuthQuery(getPlayerBansQueryKey(70), 7), false);
  assert.equal(isTournamentAuthQuery(getPlayerBansQueryKey(8), 7), false);
  assert.equal(tournamentIdFromAuthQuery(aBans), 7);
  assert.equal(tournamentIdFromAuthQuery(bBans), 8);
});

/* R18 trusted fetch-time match owner metadata — authored before code change. */
test("R18: hook persists verified A match owner metadata, logout evicts when list is gone", () => {
  const auth = renderHook(() => useAuth(), { wrapper });
  act(() => auth.result.current.storeOrgToken(7, "synthetic-a"));
  seedOwnership();
  const a = renderHook(() => useMatchGamePicks(701, { enabled: false }), { wrapper });
  const b = renderHook(() => useMatchGamePicks(801, { enabled: false }), { wrapper });
  assert.equal(client.getQueryCache().find({ queryKey: aPicks })?.meta?.web005VerifiedTournamentId, 7);
  assert.equal(client.getQueryCache().find({ queryKey: bPicks })?.meta?.web005VerifiedTournamentId, 8);
  client.setQueryData(aPicks, [{ matchId: 701, gameNumber: 1, player1HeroId: "A-only" }]);
  client.setQueryData(bPicks, [{ matchId: 801, gameNumber: 1, player1HeroId: "public-B" }]);
  client.removeQueries({ queryKey: getListMatchesQueryKey(7) });
  act(() => auth.result.current.removeOrgToken(7));
  assert.equal(client.getQueryData(aPicks), undefined);
  assert.ok(client.getQueryData(bPicks));
  a.unmount();
  b.unmount();
});

for (const status of [401, 403] as const) {
  test(`R18: match-only denied ${status} uses saved owner metadata without list`, async () => {
    renderHook(() => useAuth(), { wrapper });
    client.setQueryData(bPicks, [{ matchId: 801, player1HeroId: "B" }]);
    client.setQueryData(aPicks, [{ matchId: 701, player1HeroId: "OLD A" }]);
    await client.fetchQuery({
      queryKey: aPicks,
      meta: { web005VerifiedTournamentId: 7 },
      staleTime: 0,
      queryFn: async () => { throw Object.assign(new Error("denied"), { status }); },
    }).catch(() => undefined);
    assert.equal(client.getQueryData(aPicks), undefined);
    assert.ok(client.getQueryData(bPicks));
  });
}

test("R18: metadata-owned pending match A cannot refill after list disappears and logout", async () => {
  const auth = renderHook(() => useAuth(), { wrapper });
  act(() => auth.result.current.storeOrgToken(7, "synthetic-a"));
  seedOwnership();
  let resolve!: (v: { matchId: number; player1HeroId: string }[]) => void;
  const old = client.fetchQuery({
    queryKey: aPicks,
    meta: { web005VerifiedTournamentId: 7 },
    queryFn: () => new Promise<{ matchId: number; player1HeroId: string }[]>(finish => { resolve = finish; }),
  }).catch(() => undefined);
  await waitFor(() => assert.equal(typeof resolve, "function"));
  client.removeQueries({ queryKey: getListMatchesQueryKey(7) });
  act(() => auth.result.current.removeOrgToken(7));
  resolve([{ matchId: 701, player1HeroId: "late-old-A" }]);
  await old;
  assert.equal(client.getQueryData(aPicks), undefined);
});

test("R18: unverified and ambiguously attributed matches cannot issue or display picks", () => {
  // Legacy unknown-owner cache entry must not be displayed by a new hook.
  client.setQueryData(aPicks, [{ matchId: 701, player1HeroId: "untrusted" }]);
  const unknown = renderHook(() => useMatchGamePicks(701), { wrapper });
  assert.equal(unknown.result.current.data, undefined);
  assert.equal(client.getQueryCache().find({ queryKey: aPicks })?.meta?.web005VerifiedTournamentId, undefined);
  unknown.unmount();
  client.setQueryData(getListMatchesQueryKey(7), [{ id: 701, tournamentId: 7 }]);
  client.setQueryData(getListMatchesQueryKey(8), [{ id: 701, tournamentId: 8 }]);
  assert.equal(getVerifiedMatchTournamentOwner(client, 701), null);
  const ambiguous = renderHook(() => useMatchGamePicks(701), { wrapper });
  assert.equal(ambiguous.result.current.data, undefined);
  ambiguous.unmount();
});

test("R18: match owner cannot be guessed from match numeric ID or mismatched DTO", () => {
  client.setQueryData(getListMatchesQueryKey(7), [{ id: 701, tournamentId: 8 }]);
  assert.equal(getVerifiedMatchTournamentOwner(client, 701), null);
  client.setQueryData(getListMatchesQueryKey(7), [{ id: 701, tournamentId: 7 }]);
  assert.equal(getVerifiedMatchTournamentOwner(client, 701), 7);
  assert.equal(getVerifiedMatchTournamentOwner(client, 7), null);
});

test("R18: enabled hook late HTTP response is not cached after owner list loss and logout", async () => {
  const originalFetch = globalThis.fetch;
  let complete!: (response: Response) => void;
  let seen = 0;
  globalThis.fetch = (async (input) => {
    assert.ok(String(input).includes("/api/matches/701/game-picks"));
    seen++;
    return new Promise<Response>(resolve => { complete = resolve; });
  }) as typeof fetch;
  try {
    const setup = renderHook(() => useAuth(), { wrapper });
    act(() => setup.result.current.storeOrgToken(7, "synthetic-a"));
    setup.unmount();
    seedOwnership();
    const hook = renderHook(() => ({
      auth: useAuth(),
      picks: useMatchGamePicks(701),
    }), { wrapper });
    await waitFor(() => assert.equal(typeof complete, "function"));
    assert.equal(seen, 1);
    assert.equal(client.getQueryCache().find({ queryKey: aPicks })?.meta?.web005VerifiedTournamentId, 7);
    client.removeQueries({ queryKey: getListMatchesQueryKey(7) });
    act(() => hook.result.current.auth.removeOrgToken(7));
    await act(async () => {
      complete(new Response(JSON.stringify([{ matchId: 701, gameNumber: 1, player1HeroId: "late-A" }]), {
        status: 200, headers: { "content-type": "application/json" },
      }));
      await Promise.resolve();
      await Promise.resolve();
    });
    assert.equal(client.getQueryData(aPicks), undefined);
    assert.equal(hook.result.current.picks.data, undefined);
    hook.unmount();
  } finally {
    globalThis.fetch = originalFetch;
  }
});


/* R19 legacy untagged ownerless entry -> identity boundary -> verified rebind. */
test("R19 legacy untagged picks cannot rebind or display old A after list recovery", async () => {
  const originalFetch = globalThis.fetch;
  let finishOld!: (value: { matchId: number; gameNumber: number; player1HeroId: string }[]) => void;
  let finishNew!: (response: Response) => void;
  let newReads = 0;
  globalThis.fetch = (async (input) => {
    assert.ok(String(input).includes("/api/matches/701/game-picks"));
    newReads++;
    return new Promise<Response>(resolve => { finishNew = resolve; });
  }) as typeof fetch;
  try {
    const auth = renderHook(() => useAuth(), { wrapper });
    act(() => auth.result.current.storeOrgToken(7, "synthetic-old-A"));
    // Simulate a legacy, pre-R18 untagged query that retained private A data.
    client.setQueryData(aPicks, [{ matchId: 701, gameNumber: 1, player1HeroId: "OLD_A_SECRET" }]);
    client.setQueryData(bPicks, [{ matchId: 801, gameNumber: 1, player1HeroId: "PUBLIC_B" }]);
    const legacy = client.getQueryCache().find({ queryKey: aPicks, exact: true });
    assert.equal(legacy?.meta?.web005VerifiedTournamentId, undefined);
    const oldPending = client.fetchQuery({
      queryKey: aPicks,
      staleTime: 0,
      queryFn: () => new Promise<{ matchId: number; gameNumber: number; player1HeroId: string }[]>(
        resolve => { finishOld = resolve; },
      ),
    }).catch(() => undefined);
    await waitFor(() => assert.equal(typeof finishOld, "function"));

    // Credential revoked with canonical owner-list absent: cannot guess and
    // must preserve B. The ownerless raw A query remains in the cache.
    client.removeQueries({ queryKey: getListMatchesQueryKey(7) });
    act(() => auth.result.current.removeOrgToken(7));
    assert.ok(client.getQueryData(aPicks));
    act(() => auth.result.current.storeViewerToken(7, "synthetic-new-viewer"));
    assert.ok(client.getQueryData(bPicks));

    // A newly authorized match-list GET proves ownership of match 701, but
    // it must NOT resurrect the old query's protected OLD_A_SECRET payload.
    client.setQueryData(getListMatchesQueryKey(7), [{ id: 701, tournamentId: 7 }]);
    const current = renderHook(() => useMatchGamePicks(701), { wrapper });
    assert.equal(current.result.current.data, undefined);
    await waitFor(() => assert.equal(typeof finishNew, "function"));
    assert.equal(newReads, 1);
    const selected = client.getQueryCache().getAll().filter(q =>
      q.queryKey[0] === "matches" && q.queryKey[1] === 701 && q.queryKey[2] === "game-picks" &&
      q.queryKey.length > 3,
    );
    assert.equal(selected.length, 1);
    assert.equal(selected[0].meta?.web005VerifiedTournamentId, 7);

    // A delayed old-identity completion may fill only the orphaned OLD key,
    // never the current observer or freshly owner-scoped query.
    finishOld([{ matchId: 701, gameNumber: 1, player1HeroId: "OLD_A_LATE" }]);
    await oldPending;
    assert.equal(current.result.current.data, undefined);
    assert.deepEqual(client.getQueryData(bPicks), [{ matchId: 801, gameNumber: 1, player1HeroId: "PUBLIC_B" }]);

    await act(async () => {
      finishNew(new Response(JSON.stringify([
        { matchId: 701, gameNumber: 1, player1HeroId: "NEW_AUTHORIZED", player2HeroId: null, player1Side: null, player2Side: null },
      ]), { status: 200, headers: { "content-type": "application/json" } }));
      await Promise.resolve();
    });
    await waitFor(() => assert.equal(current.result.current.data?.[0]?.player1HeroId, "NEW_AUTHORIZED"));
    assert.deepEqual(client.getQueryData(bPicks), [{ matchId: 801, gameNumber: 1, player1HeroId: "PUBLIC_B" }]);
    current.unmount();
    auth.unmount();
  } finally {
    globalThis.fetch = originalFetch;
  }
});
