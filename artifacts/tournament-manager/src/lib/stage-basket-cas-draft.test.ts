import assert from "node:assert/strict";
import test from "node:test";
import {
  createBasketCasClient,
  type BasketCasClientOptions,
  type BasketCasGraph,
  type BasketCasScope,
} from "./stage-basket-cas-client";
import { createBasketCasDraftSession } from "./stage-basket-cas-draft";

const A: BasketCasScope = { tournamentId: 51, authContextId: "organizer-a-epoch-1" };
const B: BasketCasScope = { tournamentId: 52, authContextId: "organizer-b-epoch-2" };

function graph(color: string | null): BasketCasGraph {
  return {
    baskets: [
      { id: "a", stageId: 101, type: "input", ordinal: 1, order: 1,
        colorId: color, participantIds: [11, 12], qualifierCount: null },
      { id: "b", stageId: 102, type: "output", ordinal: 1, order: 1,
        colorId: null, participantIds: [], qualifierCount: 1 },
    ],
    routes: [{ id: "route", sourceBasketId: "b", targetBasketId: "a" }],
  };
}

function response(code: number, body: unknown, etag?: string) {
  return new Response(JSON.stringify(body), {
    status: code,
    headers: { "content-type": "application/json", ...(etag ? { etag } : {}) },
  });
}

function fake() {
  const records = new Map<number, { version: number; graph: BasketCasGraph }>([
    [A.tournamentId, { version: 1, graph: graph("blue") }],
    [B.tournamentId, { version: 1, graph: graph("orange") }],
  ]);
  const calls: Array<{ method: string; tid: number; token: string | null }> = [];
  let forceStatus: number | null = null;
  let holdPut: (() => void) | null = null;
  let holdReadA: (() => void) | null = null;
  const tag = (id: number, n: number) => `"basket-${id}-r${n}"`;
  const transport: BasketCasClientOptions["transport"] = async (url, init) => {
    const id = Number(url.split("/")[3]);
    const record = records.get(id)!;
    const method = init.method ?? "GET";
    const token = new Headers(init.headers).get("If-Match");
    calls.push({ method, tid: id, token });
    if (method === "GET") {
      if (id === A.tournamentId && holdReadA) {
        await new Promise<void>((resolve) => { holdReadA = resolve; });
      }
      return response(200, record.graph, tag(id, record.version));
    }
    if (holdPut) await new Promise<void>((resolve) => { holdPut = resolve; });
    if (forceStatus !== null) return response(forceStatus, { code: "blocked" });
    if (token !== tag(id, record.version)) {
      return response(412, { code: "STAGE_BASKET_CONFIGURATION_STALE" });
    }
    record.graph = JSON.parse(String(init.body)) as BasketCasGraph;
    record.version += 1;
    return response(200, record.graph, tag(id, record.version));
  };
  const client = createBasketCasClient({
    featureEnabled: true, serverCasVerified: true,
    transport, authHeaders: () => ({ "x-organizer-token": "synthetic-only" }),
  });
  return {
    client, records, calls,
    setStatus(code: number | null) { forceStatus = code; },
    mutateRemotely(id: number, newGraph: BasketCasGraph) {
      const record = records.get(id)!;
      record.version++;
      record.graph = newGraph;
    },
    pauseWrite() { holdPut = () => {}; },
    resumeWrite() { holdPut?.(); holdPut = null; },
    pauseReadA() { holdReadA = () => {}; },
    resumeReadA() { holdReadA?.(); holdReadA = null; },
  };
}

function color(view: ReturnType<ReturnType<typeof createBasketCasDraftSession>["view"]> | never): string | null {
  return view.localDraft?.baskets[0]?.colorId ?? null;
}

test("CAS-DRAFT-01 stale ETag keeps organizer local draft, no retry or implicit refresh", async () => {
  const server = fake();
  const session = createBasketCasDraftSession(server.client, A);
  await session.initialize();
  session.edit((d) => { d.baskets[0] = { ...d.baskets[0], colorId: "purple" }; });
  server.mutateRemotely(A.tournamentId, graph("green"));
  const result = await session.save();
  assert.equal(result, "stale");
  assert.equal(session.view().phase, "conflict");
  assert.equal(color(session.view()), "purple");
  assert.equal(session.view().remoteCanonical, null);
  assert.equal(server.calls.filter((x) => x.method === "PUT").length, 1);
  await assert.rejects(session.save(), /Reconcile conflict/);
  assert.equal(server.calls.filter((x) => x.method === "PUT").length, 1);
});

test("CAS-DRAFT-02 explicit refresh compares local against remote; keeping local DOES NOT save", async () => {
  const server = fake();
  const session = createBasketCasDraftSession(server.client, A);
  await session.initialize();
  session.edit((d) => { d.baskets[0] = { ...d.baskets[0], colorId: "purple" }; });
  server.mutateRemotely(A.tournamentId, graph("green"));
  assert.equal(await session.save(), "stale");
  await session.refreshRemote();
  const review = session.view();
  assert.equal(review.phase, "reviewing");
  assert.equal(color(review), "purple");
  assert.equal(review.remoteCanonical?.baskets[0]?.colorId, "green");
  assert.ok(review.changes.some((x) => x.id === "a" && x.change === "modified"));
  const count = server.calls.filter((x) => x.method === "PUT").length;
  session.reconcile({ action: "keep-local", confirmedByOrganizer: true });
  assert.equal(session.view().phase, "editing");
  assert.equal(color(session.view()), "purple");
  assert.equal(server.calls.filter((x) => x.method === "PUT").length, count,
    "reconciliation itself must never trigger a PUT");
  assert.equal(await session.save(), "saved");
  assert.equal(server.records.get(A.tournamentId)?.graph.baskets[0]?.colorId, "purple");
  assert.equal(server.calls.filter((x) => x.method === "PUT").length, count + 1);
});

test("CAS-DRAFT-03 explicit use-remote discards local changes ONLY with user confirmation", async () => {
  const server = fake();
  const session = createBasketCasDraftSession(server.client, A);
  await session.initialize();
  session.edit((d) => { d.baskets[0] = { ...d.baskets[0], colorId: "purple" }; });
  server.mutateRemotely(A.tournamentId, graph("green"));
  assert.equal(await session.save(), "stale");
  await assert.rejects(async () => session.reconcile({
    action: "use-remote", confirmedByOrganizer: false as never,
  }), /explicitly compare/);
  await session.refreshRemote();
  session.reconcile({ action: "use-remote", confirmedByOrganizer: true });
  assert.equal(color(session.view()), "green");
});

test("CAS-DRAFT-04 HTTP 428 keeps draft; no background resubmission", async () => {
  const server = fake();
  const session = createBasketCasDraftSession(server.client, A);
  await session.initialize();
  session.edit((d) => { d.baskets[0] = { ...d.baskets[0], colorId: "purple" }; });
  server.setStatus(428);
  assert.equal(await session.save(), "precondition-required");
  assert.equal(color(session.view()), "purple");
  assert.equal(session.view().phase, "conflict");
  assert.equal(server.calls.filter((x) => x.method === "PUT").length, 1);
});

test("CAS-DRAFT-05 repeated 412 remain gated by manual refresh/reconcile; zero uncontrolled retry", async () => {
  const server = fake();
  const session = createBasketCasDraftSession(server.client, A);
  await session.initialize();
  session.edit((d) => { d.baskets[0] = { ...d.baskets[0], colorId: "local" }; });
  for (let attempt = 0; attempt < 3; attempt++) {
    server.mutateRemotely(A.tournamentId, graph(`remote-${attempt}`));
    assert.equal(await session.save(), "stale");
    assert.equal(server.calls.filter((x) => x.method === "PUT").length, attempt + 1);
    await session.refreshRemote();
    session.reconcile({ action: "keep-local", confirmedByOrganizer: true });
  }
  assert.equal(color(session.view()), "local");
  assert.equal(server.calls.filter((x) => x.method === "PUT").length, 3);
});

test("CAS-DRAFT-06 stage navigation/roster change retains local edits and blocks old base write", async () => {
  const server = fake();
  const session = createBasketCasDraftSession(server.client, A);
  await session.initialize();
  session.edit((d) => {
    d.baskets[0] = { ...d.baskets[0], participantIds: [11, 12, 13] };
  });
  session.markStageOrRosterChanged();
  assert.equal(session.view().dependencyMayHaveChanged, true);
  assert.deepEqual(session.view().localDraft?.baskets[0].participantIds, [11, 12, 13]);
  await assert.rejects(session.save(), /Reconcile conflict/);
  assert.equal(server.calls.filter((x) => x.method === "PUT").length, 0);
  await session.refreshRemote();
  assert.equal(session.view().phase, "reviewing");
  assert.deepEqual(session.view().localDraft?.baskets[0].participantIds, [11, 12, 13]);
  session.reconcile({ action: "keep-local", confirmedByOrganizer: true });
  assert.equal(session.view().dependencyMayHaveChanged, false);
});

test("CAS-DRAFT-07 auth/tenant switch clears private old draft; no cross-tournament token reuse", async () => {
  const server = fake();
  const session = createBasketCasDraftSession(server.client, A);
  await session.initialize();
  session.edit((d) => { d.baskets[0] = { ...d.baskets[0], colorId: "secret-A" }; });
  session.switchScope(B);
  assert.equal(session.view().phase, "uninitialized");
  assert.equal(session.view().localDraft, null);
  await session.initialize();
  assert.equal(color(session.view()), "orange");
  assert.equal(await session.save(), "saved");
  assert.equal(server.calls.filter((x) => x.method === "PUT").at(-1)?.tid, B.tournamentId);
  assert.equal(server.records.get(A.tournamentId)?.graph.baskets[0]?.colorId, "blue");
});

test("CAS-DRAFT-08 change auth epoch in same tournament clears local draft", async () => {
  const server = fake();
  const session = createBasketCasDraftSession(server.client, A);
  await session.initialize();
  session.edit((d) => { d.baskets[0] = { ...d.baskets[0], colorId: "old-role-private" }; });
  session.switchScope({ ...A, authContextId: "new-organizer-epoch" });
  assert.equal(session.view().localDraft, null);
  await session.initialize();
  assert.equal(color(session.view()), "blue");
});

test("CAS-DRAFT-09 request from old tournament cannot resurrect draft after switch", async () => {
  const server = fake();
  server.pauseReadA();
  const session = createBasketCasDraftSession(server.client, A);
  const originalRead = session.initialize();
  session.switchScope(B);
  await session.initialize();
  server.resumeReadA();
  await originalRead;
  assert.equal(session.view().scope.tournamentId, B.tournamentId);
  assert.equal(color(session.view()), "orange");
});

test("CAS-DRAFT-10 revoked auth 403 clears privileged draft and token", async () => {
  const server = fake();
  const session = createBasketCasDraftSession(server.client, A);
  await session.initialize();
  session.edit((d) => { d.baskets[0] = { ...d.baskets[0], colorId: "secret-A" }; });
  server.setStatus(403);
  await assert.rejects(session.save(), /Basket PUT failed/);
  assert.equal(session.view().phase, "uninitialized");
  assert.equal(session.view().localDraft, null);
});

test("CAS-DRAFT-11 in-flight write plus later local edit never discards newer draft", async () => {
  const server = fake();
  const session = createBasketCasDraftSession(server.client, A);
  await session.initialize();
  session.edit((d) => { d.baskets[0] = { ...d.baskets[0], colorId: "sent" }; });
  server.pauseWrite();
  const pending = session.save();
  session.edit((d) => { d.baskets[0] = { ...d.baskets[0], colorId: "newer-local" }; });
  server.resumeWrite();
  assert.equal(await pending, "superseded");
  assert.equal(server.records.get(A.tournamentId)?.graph.baskets[0]?.colorId, "sent");
  assert.equal(color(session.view()), "newer-local");
  assert.equal(session.view().phase, "reviewing");
  await assert.rejects(session.save(), /Reconcile conflict/);
});

test("CAS-DRAFT-12 caller mutating view copy cannot alter canonical/owned draft", async () => {
  const server = fake();
  const session = createBasketCasDraftSession(server.client, A);
  await session.initialize();
  const copy = session.view().localDraft!;
  (copy.baskets as Array<{ colorId: string | null }>)[0].colorId = "illegal-mutation";
  assert.equal(color(session.view()), "blue");
});

test("CAS-DRAFT-13 destroy discards privacy state, pending operations cannot revive it", async () => {
  const server = fake();
  const session = createBasketCasDraftSession(server.client, A);
  await session.initialize();
  session.destroy();
  assert.throws(() => session.view(), /destroyed/);
  await assert.rejects(session.initialize(), /destroyed/);
});
