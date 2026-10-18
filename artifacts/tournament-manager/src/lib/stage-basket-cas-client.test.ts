import assert from "node:assert/strict";
import test from "node:test";
import {
  BasketCasError,
  createBasketCasClient,
  type BasketCasClientOptions,
  type BasketCasGraph,
  type BasketCasScope,
} from "./stage-basket-cas-client";

const A: BasketCasScope = { tournamentId: 41, authContextId: "organizer-epoch-1" };
const B: BasketCasScope = { tournamentId: 42, authContextId: "organizer-epoch-2" };
const graph = (colorId: string | null = "blue"): BasketCasGraph => ({
  baskets: [{
    id: "input", stageId: 7, type: "input", ordinal: 1, order: 1,
    colorId, participantIds: [1, 2], qualifierCount: null,
  }],
  routes: [],
});

function json(status: number, payload: unknown, etag?: string) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json",
      ...(etag === undefined ? {} : { etag }),
    },
  });
}

function fakeServer() {
  const writes: Array<{ url: string; init: RequestInit }> = [];
  const reads: Array<{ url: string; init: RequestInit }> = [];
  const revision = new Map<number, number>([[A.tournamentId, 1], [B.tournamentId, 1]]);
  const graphs = new Map<number, BasketCasGraph>([[A.tournamentId, graph()], [B.tournamentId, graph("red")]]);
  let forceGetTag: string | null | undefined;
  let forcePutStatus: number | null = null;
  const expected = (tid: number) => `"cas-${tid}-r${revision.get(tid)}"`;

  const transport: BasketCasClientOptions["transport"] = async (url, init) => {
    const tid = Number(url.split("/")[3]);
    if (!revision.has(tid)) return json(404, { code: "NOT_FOUND" });
    const headers = new Headers(init.headers);
    if (init.method === "GET") {
      reads.push({ url, init });
      return json(200, graphs.get(tid), forceGetTag === undefined
        ? expected(tid)
        : forceGetTag ?? undefined);
    }
    writes.push({ url, init });
    if (!headers.has("If-Match")) return json(428, { code: "PRECONDITION_REQUIRED" });
    if (forcePutStatus) return json(forcePutStatus, { code: "BLOCKED" });
    const token = headers.get("If-Match");
    if (token !== expected(tid)) {
      return json(412, { code: "STAGE_BASKET_CONFIGURATION_STALE" });
    }
    const next = JSON.parse(String(init.body)) as BasketCasGraph;
    graphs.set(tid, next);
    revision.set(tid, revision.get(tid)! + 1);
    return json(200, next, expected(tid));
  };

  return {
    transport, writes, reads, revision, graphs,
    setGetTag(value: string | null | undefined) { forceGetTag = value; },
    setPutStatus(value: number | null) { forcePutStatus = value; },
  };
}

function enabled(server: ReturnType<typeof fakeServer>) {
  return createBasketCasClient({
    featureEnabled: true,
    serverCasVerified: true,
    transport: server.transport,
    authHeaders: () => ({ "x-organizer-token": "synthetic-test-token" }),
  });
}

test("CAS-CLIENT-01 disabled by default AND server capability gate: zero network", async () => {
  const server = fakeServer();
  for (const gates of [
    {},
    { featureEnabled: true },
    { serverCasVerified: true },
    { featureEnabled: false, serverCasVerified: true },
  ]) {
    const client = createBasketCasClient({
      ...gates, transport: server.transport, authHeaders: () => ({}),
    });
    await assert.rejects(client.load(A), (error: unknown) =>
      error instanceof BasketCasError && error.code === "FEATURE_DISABLED");
  }
  assert.equal(server.reads.length, 0);
  assert.equal(server.writes.length, 0);
});

test("CAS-CLIENT-02 missing ETag rejects GET, never fabricates token/PUT", async () => {
  const server = fakeServer();
  server.setGetTag(null);
  await assert.rejects(enabled(server).load(A), (e: unknown) =>
    e instanceof BasketCasError && e.code === "MISSING_ETAG");
  assert.equal(server.writes.length, 0);
});

test("CAS-CLIENT-03 weak/unquoted/list ETag rejects without write", async () => {
  const server = fakeServer();
  for (const bad of ['W/"cas-41-r1"', "cas-41-r1", '"a","b"', '""']) {
    server.setGetTag(bad);
    await assert.rejects(enabled(server).load(A), (e: unknown) =>
      e instanceof BasketCasError && e.code === "INVALID_ETAG", bad);
  }
  assert.equal(server.writes.length, 0);
});

test("CAS-CLIENT-04 current ETag used unmodified in If-Match, saved server token advances", async () => {
  const server = fakeServer();
  const client = enabled(server);
  const snapshot = await client.load(A);
  assert.equal(snapshot.etag, '"cas-41-r1"');
  const result = await client.save(A, snapshot, graph("green"));
  assert.equal(result.kind, "saved");
  if (result.kind !== "saved") return;
  assert.equal(result.canonical.etag, '"cas-41-r2"');
  assert.equal(server.revision.get(A.tournamentId), 2);
  const headers = new Headers(server.writes[0].init.headers);
  assert.equal(headers.get("If-Match"), '"cas-41-r1"');
  assert.deepEqual(server.graphs.get(A.tournamentId), graph("green"));
});

test("CAS-CLIENT-05 old token returns 412; no automatic HTTP retry", async () => {
  const server = fakeServer();
  const client = enabled(server);
  const stale = await client.load(A);
  server.revision.set(A.tournamentId, 2); // independent organizer wrote V2
  const outcome = await client.save(A, stale, graph("local"));
  assert.deepEqual(outcome, { kind: "stale", code: "STAGE_BASKET_CONFIGURATION_STALE" });
  assert.equal(server.writes.length, 1);
  assert.equal(server.revision.get(A.tournamentId), 2);
});

test("CAS-CLIENT-06 server 428 is explicit, no automatic retry", async () => {
  const server = fakeServer();
  const client = enabled(server);
  const current = await client.load(A);
  server.setPutStatus(428);
  const outcome = await client.save(A, current, graph("local"));
  assert.deepEqual(outcome, { kind: "precondition-required" });
  assert.equal(server.writes.length, 1);
});

test("CAS-CLIENT-07 rejects cross-tournament, cross-auth and foreign-client snapshots BEFORE PUT", async () => {
  const server = fakeServer();
  const one = enabled(server);
  const two = enabled(server);
  const original = await one.load(A);
  for (const [client, scope] of [
    [one, B],
    [one, { ...A, authContextId: "new-organizer-epoch" }],
    [two, A],
  ] as const) {
    await assert.rejects(client.save(scope, original, graph()), (e: unknown) =>
      e instanceof BasketCasError && e.code === "WRONG_SCOPE");
  }
  assert.equal(server.writes.length, 0);
});

test("CAS-CLIENT-08 failing HTTP auth does not get reinterpreted as a 412 conflict", async () => {
  const server = fakeServer();
  const client = enabled(server);
  const prior = await client.load(A);
  server.setPutStatus(403);
  await assert.rejects(client.save(A, prior, graph()), (e: unknown) =>
    e instanceof BasketCasError && e.code === "HTTP_FAILURE" && e.httpStatus === 403);
  assert.equal(server.writes.length, 1);
});

test("CAS-CLIENT-09 successful response must return a NEW strong ETag", async () => {
  const server = fakeServer();
  const old = await enabled(server).load(A);
  const client = createBasketCasClient({
    featureEnabled: true, serverCasVerified: true,
    authHeaders: () => ({}),
    transport: async (_url, init) => {
      if (init.method === "GET") return json(200, graph(), '"cas-41-r1"');
      return json(200, graph(), '"cas-41-r1"');
    },
  });
  const own = await client.load(A);
  await assert.rejects(client.save(A, own, graph()), (e: unknown) =>
    e instanceof BasketCasError && e.code === "PROTOCOL_ERROR");
  assert.equal(old.etag, '"cas-41-r1"');
});

test("CAS-CLIENT-10 no permitted fake token from a caller-created object", async () => {
  const server = fakeServer();
  const client = enabled(server);
  const fabricated = {
    scope: A, etag: '"cas-41-r1"', graph: graph(),
  };
  // Deliberate malicious casting cannot defeat runtime provenance.
  await assert.rejects(
    client.save(A, fabricated as never, graph("red")),
    (e: unknown) => e instanceof BasketCasError && e.code === "WRONG_SCOPE",
  );
  assert.equal(server.writes.length, 0);
});
