/**
 * WEB-005 / A110 / DEVELOPMENT FIRST WAVE3
 *
 * ISOLATED TEST ONLY. This file is based on the immutable PR63 HEAD
 * 52f3e1db334fc5b178fb3f4ed21d4099a0d6558f, without touching PR63,
 * its frontend implementation, the live StageBasketsPanel or the server.
 *
 * All transport, auth and concurrency events below are synthetic; there are
 * no DB requests, remote network requests, production credentials or retries.
 * Source-defined assertions are NOT runtime PASS until actually executed.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BasketCasError,
  createBasketCasClient,
  type BasketCasClient,
  type BasketCasGraph,
  type BasketCasScope,
  type BasketCasTransport,
} from "./stage-basket-cas-client";
import { createBasketCasDraftSession } from "./stage-basket-cas-draft";

const A: BasketCasScope = { tournamentId: 501, authContextId: "user-a-session-1" };
const B: BasketCasScope = { tournamentId: 502, authContextId: "user-b-session-1" };

const graph = (colorId: string): BasketCasGraph => ({
  baskets: [{
    id: "basket-1", stageId: 10, type: "input", ordinal: 1, order: 1,
    colorId, participantIds: [1, 2], qualifierCount: null,
  }],
  routes: [],
});

function response(status: number, body: unknown, etag?: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...(etag ? { etag } : {}) },
  });
}

function fixture() {
  const state = new Map<number, { revision: number; graph: BasketCasGraph }>([
    [A.tournamentId, { revision: 1, graph: graph("blue") }],
    [B.tournamentId, { revision: 1, graph: graph("orange") }],
  ]);
  const deniedGet = new Map<number, 401 | 403>();
  let deniedPut: 428 | null = null;
  let pendingPut: Promise<void> | null = null;
  let releasePut: (() => void) | null = null;
  const writes: Array<{ tournamentId: number; ifMatch: string | null }> = [];
  const reads: number[] = [];
  const tag = (id: number, revision: number) => `"cas-${id}-rev-${revision}"`;

  const transport: BasketCasTransport = async (url, init) => {
    const id = Number(url.match(/^\/api\/tournaments\/(\d+)\/stage-baskets$/)?.[1]);
    const current = state.get(id);
    if (!current) return response(404, { code: "NOT_FOUND" });
    if (init.method === "GET") {
      reads.push(id);
      const deny = deniedGet.get(id);
      if (deny) return response(deny, { code: "AUTH_DENIED" });
      return response(200, current.graph, tag(id, current.revision));
    }
    const ifMatch = new Headers(init.headers).get("If-Match");
    writes.push({ tournamentId: id, ifMatch });
    if (pendingPut) await pendingPut;
    if (deniedPut) return response(deniedPut, { code: "PRECONDITION_REQUIRED" });
    if (!ifMatch) return response(428, { code: "PRECONDITION_REQUIRED" });
    if (ifMatch !== tag(id, current.revision)) {
      return response(412, { code: "STAGE_BASKET_CONFIGURATION_STALE" });
    }
    current.graph = JSON.parse(String(init.body)) as BasketCasGraph;
    current.revision++;
    return response(200, current.graph, tag(id, current.revision));
  };
  const client = createBasketCasClient({
    featureEnabled: true,
    serverCasVerified: true,
    transport,
    authHeaders: () => ({ "x-organizer-token": "synthetic-test-only" }),
  });
  return {
    client, writes, reads, state,
    getDenied(id: number, code: 401 | 403 | null) {
      if (code === null) deniedGet.delete(id);
      else deniedGet.set(id, code);
    },
    putDenied(code: 428 | null) { deniedPut = code; },
    externalEdit(id: number, colorId: string) {
      const current = state.get(id)!;
      current.revision++;
      current.graph = graph(colorId);
    },
    pausePut() {
      assert.equal(pendingPut, null);
      pendingPut = new Promise<void>((resolve) => { releasePut = resolve; });
    },
    releasePut() {
      assert.ok(releasePut);
      releasePut!();
      pendingPut = null;
      releasePut = null;
    },
  };
}

async function withEditedDraft(client: BasketCasClient, colorId = "local-purple") {
  const session = createBasketCasDraftSession(client, A);
  await session.initialize();
  session.edit((draft) => {
    draft.baskets[0] = { ...draft.baskets[0], colorId };
  });
  return session;
}

test("W3-A110-01 GET 403 quarantines unsaved draft: no visible graph, no PUT, no implicit refresh", async () => {
  const f = fixture();
  const session = await withEditedDraft(f.client);
  const previousReads = f.reads.length;
  f.getDenied(A.tournamentId, 403);
  await assert.rejects(session.refreshRemote(), (error: unknown) =>
    error instanceof BasketCasError && error.httpStatus === 403);
  assert.equal(session.view().phase, "authorization-blocked");
  assert.equal(session.view().authorizationFailure, 403);
  assert.equal(session.view().localDraft, null);
  assert.equal(session.view().remoteCanonical, null);
  assert.deepEqual(session.view().changes, []);
  await assert.rejects(session.save(), /Reconcile conflict/);
  assert.equal(f.writes.length, 0);
  assert.equal(f.reads.length, previousReads + 1, "no background GET retry");
});

test("W3-A110-02 repeated GET 401/403 preserves private local edit until deliberate same-scope renewal", async () => {
  const f = fixture();
  const session = await withEditedDraft(f.client, "unsaved-2026");
  f.externalEdit(A.tournamentId, "remote-v2");
  f.getDenied(A.tournamentId, 401);
  await assert.rejects(session.refreshRemote(), /Basket GET failed/);
  assert.equal(session.view().authorizationFailure, 401);
  f.getDenied(A.tournamentId, 403);
  await assert.rejects(session.refreshRemote(), /Basket GET failed/);
  assert.equal(session.view().authorizationFailure, 403);
  assert.equal(session.view().localDraft, null);
  assert.equal(f.writes.length, 0);
  f.getDenied(A.tournamentId, null);
  await session.refreshRemote(); // explicit organizer-initiated revalidation
  assert.equal(session.view().phase, "reviewing");
  assert.equal(session.view().authorizationFailure, null);
  assert.equal(session.view().localDraft?.baskets[0]?.colorId, "unsaved-2026");
  assert.equal(session.view().remoteCanonical?.baskets[0]?.colorId, "remote-v2");
  assert.equal(f.writes.length, 0, "GET reauthorization itself must never PUT");
  session.reconcile({ action: "keep-local", confirmedByOrganizer: true });
  assert.equal(f.writes.length, 0, "explicit reconcile must not auto-save");
  assert.equal(await session.save(), "saved");
  assert.equal(f.writes.length, 1);
  assert.equal(f.writes[0].ifMatch, '"cas-501-rev-2"');
});

test("W3-A110-03 changing identity epoch after denied GET destroys A draft, never reveals it to renewed B identity", async () => {
  const f = fixture();
  const session = await withEditedDraft(f.client, "sensitive-A");
  f.getDenied(A.tournamentId, 403);
  await assert.rejects(session.refreshRemote(), /Basket GET failed/);
  session.switchScope({ ...A, authContextId: "different-principal-or-session" });
  assert.equal(session.view().phase, "uninitialized");
  assert.equal(session.view().localDraft, null);
  f.getDenied(A.tournamentId, null);
  await session.initialize();
  assert.equal(session.view().localDraft?.baskets[0]?.colorId, "blue");
  assert.equal(f.writes.length, 0);
  session.switchScope(B);
  await session.initialize();
  assert.equal(session.view().localDraft?.baskets[0]?.colorId, "orange");
  assert.equal(session.view().scope.authContextId, B.authContextId);
});

test("W3-A110-04 stale 412 cannot trigger automatic second write; each future retry needs deliberate new GET and confirmation", async () => {
  const f = fixture();
  const session = await withEditedDraft(f.client, "my-choice");
  f.externalEdit(A.tournamentId, "other-editor-v2");
  assert.equal(await session.save(), "stale");
  assert.equal(f.writes.length, 1);
  await assert.rejects(session.save(), /Reconcile conflict/);
  assert.equal(f.writes.length, 1);
  await session.refreshRemote();
  session.reconcile({ action: "keep-local", confirmedByOrganizer: true });
  assert.equal(f.writes.length, 1);
  f.externalEdit(A.tournamentId, "other-editor-v3");
  assert.equal(await session.save(), "stale");
  assert.equal(f.writes.length, 2);
  await assert.rejects(session.save(), /Reconcile conflict/);
  assert.equal(f.writes.length, 2);
  assert.equal(session.view().localDraft?.baskets[0]?.colorId, "my-choice");
});

test("W3-A110-05 missing precondition 428 retains draft and never resends automatically", async () => {
  const f = fixture();
  const session = await withEditedDraft(f.client, "keep-428");
  f.putDenied(428);
  assert.equal(await session.save(), "precondition-required");
  assert.equal(session.view().phase, "conflict");
  assert.equal(session.view().localDraft?.baskets[0]?.colorId, "keep-428");
  assert.equal(f.writes.length, 1);
  await assert.rejects(session.save(), /Reconcile conflict/);
  assert.equal(f.writes.length, 1);
});

test("W3-A110-06 two simultaneous save calls yield at most one PUT, even while server response is pending", async () => {
  const f = fixture();
  const session = await withEditedDraft(f.client);
  f.pausePut();
  const first = session.save();
  assert.equal(f.writes.length, 1, "first request reached the synthetic transport");
  await assert.rejects(session.save(), /Reconcile conflict/);
  assert.equal(f.writes.length, 1, "second action must NOT issue a duplicate PUT");
  f.releasePut();
  assert.equal(await first, "saved");
  assert.equal(f.writes.length, 1);
  assert.equal(f.state.get(A.tournamentId)?.revision, 2);
});

test("W3-A110-07 while canonical refresh is pending, a stale save is rejected before HTTP PUT", async () => {
  const f = fixture();
  const upstream = f.client;
  let releaseRead: (() => void) | undefined;
  let loads = 0;
  const delayed: BasketCasClient = {
    save: upstream.save,
    async load(scope) {
      if (++loads === 2) {
        await new Promise<void>((resolve) => { releaseRead = resolve; });
      }
      return upstream.load(scope);
    },
  };
  const session = await withEditedDraft(delayed, "pending-local");
  const pending = session.refreshRemote();
  assert.equal(session.view().refreshing, true);
  await assert.rejects(session.save(), /Finish remote refresh/);
  assert.equal(f.writes.length, 0);
  assert.ok(releaseRead);
  releaseRead!();
  await pending;
  assert.equal(session.view().phase, "reviewing");
  assert.equal(session.view().localDraft?.baskets[0]?.colorId, "pending-local");
  await assert.rejects(session.save(), /Reconcile conflict/);
});

test("W3-A110-08 old denied A GET cannot poison new B session or trigger a cross-tournament write", async () => {
  const f = fixture();
  const upstream = f.client;
  let releaseOldA: (() => void) | undefined;
  let readsFromA = 0;
  const delayed: BasketCasClient = {
    save: upstream.save,
    async load(scope) {
      if (scope.tournamentId === A.tournamentId && ++readsFromA === 2) {
        await new Promise<void>((resolve) => { releaseOldA = resolve; });
      }
      return upstream.load(scope);
    },
  };
  const session = await withEditedDraft(delayed, "private-A");
  const previous = session.refreshRemote();
  session.switchScope(B);
  await session.initialize();
  assert.equal(session.view().localDraft?.baskets[0]?.colorId, "orange");
  f.getDenied(A.tournamentId, 403);
  assert.ok(releaseOldA);
  releaseOldA!();
  await assert.rejects(previous, /Basket GET failed/);
  assert.equal(session.view().authorizationFailure, null);
  assert.equal(session.view().scope.tournamentId, B.tournamentId);
  assert.equal(session.view().localDraft?.baskets[0]?.colorId, "orange");
  assert.equal(await session.save(), "saved");
  assert.deepEqual(f.writes.map((w) => w.tournamentId), [B.tournamentId]);
});
