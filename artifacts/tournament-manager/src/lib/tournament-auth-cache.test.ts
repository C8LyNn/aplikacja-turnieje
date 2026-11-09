import assert from "node:assert/strict";
import { test } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import {
  getVerifiedMatchTournamentOwner, isTournamentAuthQuery,
  removeTournamentAuthQueries, subscribeToTournamentAuthDenials,
} from "./tournament-query-invalidation";

test("credential change purges only its tournament and proven match picks", t => {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
  t.after(() => client.clear());
  const owned = [
    ["/api/tournaments/1"], ["/api/tournaments/1/stages/2"],
    ["tournaments", 1, "player-bans"], ["matches", 7, "game-picks"],
  ];
  const unrelated = [
    ["/api/tournaments/10"], ["/api/tournaments/2/players"],
    ["matches", 8, "game-picks"], ["catalog"],
  ];
  for (const key of [...owned, ...unrelated]) client.setQueryData(key, ["private"]);
  client.setQueryData(["/api/tournaments/1/matches"], [{ id: 7, tournamentId: 1 }]);
  removeTournamentAuthQueries(client, 1);
  for (const key of owned) assert.equal(client.getQueryData(key), undefined, String(key));
  for (const key of unrelated) assert.deepEqual(client.getQueryData(key), ["private"], String(key));
  assert.equal(isTournamentAuthQuery(["/api/tournaments/10"], 1), false);
  assert.equal(isTournamentAuthQuery(["/api/tournaments/1evil"], 1), false);
});

test("successful match DTO is required to attribute ownership; ambiguity fails closed", t => {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
  t.after(() => client.clear());
  client.setQueryData(["/api/tournaments/1/matches"], [{ id: 7 }]);
  assert.equal(getVerifiedMatchTournamentOwner(client, 7), null);
  client.setQueryData(["/api/tournaments/1/matches"], [{ id: 7, tournamentId: 1 }]);
  assert.equal(getVerifiedMatchTournamentOwner(client, 7), 1);
  client.setQueryData(["/api/tournaments/2/matches"], [{ id: 7, tournamentId: 2 }]);
  assert.equal(getVerifiedMatchTournamentOwner(client, 7), null);
});

for (const status of [401, 403, 503]) {
  test(`background ${status} ${status === 503 ? "retains" : "evicts"} previously cached private data`, async t => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const unsubscribe = subscribeToTournamentAuthDenials(client);
    t.after(() => { unsubscribe(); client.clear(); });
    const key = ["/api/tournaments/1/players"];
    client.setQueryData(key, ["secret"]);
    client.setQueryData(["/api/tournaments/2/players"], ["other"]);
    await assert.rejects(client.fetchQuery({ queryKey: key, queryFn: async () => { throw Object.assign(new Error("Denied"), { status }); } }));
    assert.deepEqual(client.getQueryData(key), status === 503 ? ["secret"] : undefined);
    assert.equal(client.getQueryState(key)?.status, "error", "Keep the denied observer in an error state, without private data");
    assert.deepEqual(client.getQueryData(["/api/tournaments/2/players"]), ["other"]);
  });
}

test("late canceled response cannot refill a revoked private cache", async t => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  t.after(() => client.clear());
  const key = ["/api/tournaments/1/players"];
  let release!: (value: string[]) => void;
  const request = client.fetchQuery({
    queryKey: key, queryFn: () => new Promise<string[]>(resolve => { release = resolve; }),
  }).catch(() => undefined);
  removeTournamentAuthQueries(client, 1);
  release(["old private data"]);
  await request;
  assert.equal(client.getQueryData(key), undefined);
});

test("captured picks owner survives loss of its match list, without evicting other tenants", async t => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const unsubscribe = subscribeToTournamentAuthDenials(client);
  t.after(() => { unsubscribe(); client.clear(); });
  client.setQueryData(["/api/tournaments/1/players"], ["private"]);
  client.setQueryData(["/api/tournaments/2/players"], ["other"]);
  await assert.rejects(client.fetchQuery({
    queryKey: ["matches", 7, "game-picks", "verified-owner", 1],
    meta: { web005VerifiedTournamentId: 1 },
    queryFn: async () => { throw Object.assign(new Error("Denied"), { response: { status: 403 } }); },
  }));
  assert.equal(client.getQueryData(["/api/tournaments/1/players"]), undefined);
  assert.deepEqual(client.getQueryData(["/api/tournaments/2/players"]), ["other"]);
});
