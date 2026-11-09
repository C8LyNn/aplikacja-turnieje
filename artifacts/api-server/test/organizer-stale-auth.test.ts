import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { transformSync } from "esbuild";
import {
  organizerCredentialFingerprint, signVersionedOrganizerToken,
  verifyOrganizerToken, verifyViewerToken,
} from "../src/auth";

// Execute the real policy/DELETE handler with controlled database ports.
// This is not a substitute for the PostgreSQL integration race.
const policy = readFileSync(new URL("../src/access-policy.ts", import.meta.url), "utf8");
const routes = readFileSync(new URL("../src/routes/tournaments.ts", import.meta.url), "utf8");
function compile(source: string, env: Record<string, unknown>, result: string): any {
  const { code } = transformSync(source.replace(/^import .*;$/gm, "").replace(/^export /gm, ""), {
    loader: "ts", target: "es2022",
  });
  return new Function(...Object.keys(env), `${code}\nreturn ${result};`)(...Object.values(env));
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(r => { resolve = r; });
  return { promise, resolve };
}
function fixture(blocked = false) {
  const original = { id: 7, organizerPasswordHash: "synthetic-original-hash", supportPasswordVersion: 1 };
  const current = { ...original };
  const tables = { tournamentsTable: { id: "id" }, supportSessionsTable: {} };
  const queued = deferred(), release = deferred();
  const state = { writes: 0, supportVersion: 1, supportLocks: 0, tournamentLocks: 0 };
  const db: any = {
    select: () => {
      let table: unknown;
      const query = {
        from(t: unknown) { table = t; return query; },
        where() { return query; },
        then(resolve: any, reject: any) { return Promise.resolve([{ ...original }]).then(resolve, reject); },
        async for(mode: string) {
          assert.equal(mode, "update");
          if (table === tables.supportSessionsTable) {
            state.supportLocks++;
            return [{ passwordVersion: state.supportVersion }];
          }
          state.tournamentLocks++;
          queued.resolve();
          if (blocked) await release.promise;
          return [{ ...current }];
        },
      };
      return query;
    },
    transaction: async (operation: any) => operation(db),
    delete: () => ({ where: async () => { state.writes++; } }),
  };
  const api = compile(policy, {
    db, ...tables, organizerCredentialFingerprint, verifyOrganizerToken, verifyViewerToken,
    eq: () => undefined, and: () => undefined, sql: () => undefined, logger: { warn() {} },
  }, "({ requireOrganizer, getTournamentMutationActor, withTournamentMutationLock, revalidateTournamentMutationActor, TournamentMutationAuthorizationError })");
  const token = signVersionedOrganizerToken(original.id, original.organizerPasswordHash);
  const req = { headers: { "x-organizer-token": token }, params: { id: "7" } };
  const res = {
    statusCode: 200,
    status(code: number) { this.statusCode = code; return this; },
    json() { return this; },
    sendStatus(code: number) { this.statusCode = code; return this; },
  };
  return { original, current, state, queued, release, db, tables, api, req, res, token };
}

test("organizer context keeps only the verified fingerprint, never a bearer token or password hash", async () => {
  const f = fixture();
  const access = await f.api.requireOrganizer(f.req, f.res, 7);
  assert.deepEqual(Object.keys(access.actor).sort(), ["credentialFingerprint", "type"]);
  assert.ok(!Object.values(access.actor).includes(f.token));
  assert.ok(!Object.values(access.actor).includes(f.original.organizerPasswordHash));
  assert.ok(access.actor.credentialFingerprint === organizerCredentialFingerprint(7, f.original.organizerPasswordHash));
});

test("organizer authorized before waiting is rejected after credential rotation without writes", { timeout: 2000 }, async () => {
  const f = fixture(true);
  const actor = f.api.getTournamentMutationActor(await f.api.requireOrganizer(f.req, f.res, 7));
  const mutation = f.api.withTournamentMutationLock(7, actor, async () => { f.state.writes++; });
  const rejected = assert.rejects(mutation, f.api.TournamentMutationAuthorizationError);
  await f.queued.promise;
  f.current.organizerPasswordHash = "synthetic-rotated-hash";
  f.release.resolve();
  await rejected;
  assert.equal(f.state.writes, 0);
  assert.equal(f.state.tournamentLocks, 1);
});

test("unchanged organizer credential remains authorized under the lock", async () => {
  const f = fixture();
  const actor = f.api.getTournamentMutationActor(await f.api.requireOrganizer(f.req, f.res, 7));
  await f.api.withTournamentMutationLock(7, actor, async () => { f.state.writes++; });
  assert.equal(f.state.writes, 1);
});

test("an organizer actor missing its verified fingerprint fails closed", async () => {
  const f = fixture();
  await assert.rejects(
    f.api.withTournamentMutationLock(7, { type: "organizer" }, async () => { f.state.writes++; }),
    f.api.TournamentMutationAuthorizationError,
  );
  assert.equal(f.state.writes, 0);
});

test("support recheck still locks the session and rejects a revoked version", async () => {
  const f = fixture();
  const support = { type: "support", nick: "Synthetic support", sessionId: 11 };
  await f.api.withTournamentMutationLock(7, support, async () => { f.state.writes++; });
  f.state.supportVersion = 2;
  await assert.rejects(
    f.api.withTournamentMutationLock(7, support, async () => { f.state.writes++; }),
    f.api.TournamentMutationAuthorizationError,
  );
  assert.equal(f.state.writes, 1);
  assert.equal(f.state.supportLocks, 2);
});

test("a valid signature for a different tournament is not accepted", async () => {
  const f = fixture();
  f.req.headers["x-organizer-token"] = signVersionedOrganizerToken(8, f.original.organizerPasswordHash);
  assert.equal(await f.api.requireOrganizer(f.req, f.res, 7), null);
  assert.equal(f.res.statusCode, 403);
});

for (const rotate of [false, true]) {
  test(`actual tournament DELETE handler rechecks after locking (rotation=${rotate})`, { timeout: 2000 }, async () => {
    const f = fixture(true);
    const start = routes.indexOf('router.delete("/tournaments/:id"');
    assert.ok(start >= 0);
    const route = routes.slice(start, routes.indexOf("\n});", start) + 5);
    const handler = compile("const handler = " + route.slice(route.indexOf("async "), route.lastIndexOf("});") + 1), {
      ...f.api, db: f.db, ...f.tables, eq: () => undefined,
      DeleteTournamentParams: { safeParse: () => ({ success: true, data: { id: 7 } }) },
    }, "handler");
    const mutation = handler(f.req, f.res);
    const outcome = rotate
      ? assert.rejects(mutation, f.api.TournamentMutationAuthorizationError)
      : mutation;
    await f.queued.promise;
    if (rotate) f.current.organizerPasswordHash = "synthetic-rotated-hash";
    f.release.resolve();
    await outcome;
    assert.equal(f.state.writes, rotate ? 0 : 1);
    if (!rotate) assert.equal(f.res.statusCode, 204);
    assert.equal(f.state.tournamentLocks, 1);
  });
}
