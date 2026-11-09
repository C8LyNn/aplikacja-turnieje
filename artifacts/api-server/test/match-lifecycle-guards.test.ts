import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { transformSync } from "esbuild";
import { and, eq, inArray } from "drizzle-orm";
import { PgDialect, QueryBuilder } from "drizzle-orm/pg-core";
import { matchesTable, tournamentsTable, tournamentStagesTable, stageParticipantsTable, playersTable } from "@workspace/db/schema";
import { assertCancelRestoreState, MatchLifecycleConflict } from "../src/application/matches/cancel-restore-policy";

const routes = readFileSync(new URL("../src/routes/tournaments.ts", import.meta.url), "utf8");
const auth = readFileSync(new URL("../src/routes/auth.ts", import.meta.url), "utf8");
function compile(source: string, env: Record<string, unknown>, result: string): any {
  return new Function(...Object.keys(env), transformSync(source, { loader: "ts" }).code + "\nreturn " + result)(...Object.values(env));
}
function handler(source: string, path: string, env: Record<string, unknown>) {
  const start = source.indexOf(`router.${path}`);
  assert.ok(start >= 0, path);
  const text = source.slice(start, source.indexOf("\n});", start) + 5);
  return compile("const run = " + text.slice(text.indexOf("async"), text.lastIndexOf("});") + 1), env, "run");
}
const helperStart = routes.indexOf("async function assertLockedCancelRestoreState(");
const lockedHelperText = routes.slice(helperStart, routes.indexOf('\nrouter.post("/matches/:id/cancel"', helperStart));
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(r => { resolve = r; });
  return { promise, resolve };
}

function lifecycle(operation: "cancel" | "restore", patchBody?: Record<string, unknown>) {
  const queued = deferred(), release = deferred();
  const initial = {
    id: 11, tournamentId: 7, stageId: 2, status: operation === "cancel" ? "pending" : "cancelled",
    resultType: null as string | null, completedAt: null as Date | null, winnerId: null as number | null,
    player1Id: null, player2Id: null, round: 1, matchNumber: 1, note: null,
  };
  const state = { match: { ...initial }, tournament: "active", stage: "active" as string | undefined, writes: 0 };
  let held = false;
  function select(current: boolean) {
    let table: unknown;
    const q: any = {
      from(t: unknown) { table = t; return q; }, where() { return q; },
      for(mode: string) { assert.equal(mode, "update"); assert.ok(held); return q; },
      then(resolve: (rows: unknown[]) => void) {
        resolve(table === matchesTable ? [current ? state.match : initial]
          : table === tournamentsTable ? [{ id: 7, status: state.tournament }]
          : state.stage === undefined ? [] : [{ status: state.stage }]);
      },
    };
    return q;
  }
  const tx: any = {
    select: () => select(true),
    update: () => {
      assert.ok(held); state.writes++;
      const q: any = { set() { return q; }, where() { return q; }, returning: async () => [state.match] };
      return q;
    },
  };
  const assertLockedCancelRestoreState = compile(lockedHelperText, {
    tournamentStagesTable, and, eq, assertCancelRestoreState,
  }, "assertLockedCancelRestoreState");
  const schema = { safeParse: (body: unknown) => ({ success: true, data: body }) };
  const params = { safeParse: () => ({ success: true, data: { id: 11 } }) };
  const env = {
    db: { select: () => select(false) }, matchesTable, tournamentsTable, and, eq,
    CancelMatchParams: params, CancelMatchBody: schema, RestoreCancelledMatchParams: params,
    UpdateMatchParams: params, UpdateMatchBody: schema,
    requireTournamentWrite: async () => ({ actor: { type: "organizer" } }),
    getTournamentMutationActor: () => ({ type: "organizer" }),
    withTournamentMutationLock: async (_id: number, _actor: unknown, run: any) => {
      queued.resolve(); await release.promise; held = true;
      try { return await run(tx); } finally { held = false; }
    },
    assertLockedCancelRestoreState, MatchLifecycleConflict,
    enrichMatches: async (rows: unknown[]) => rows,
    logAction: async () => { state.writes++; },
  };
  const run = handler(routes, patchBody ? 'patch("/matches/:id"' : `post("/matches/:id/${operation === "cancel" ? "cancel" : "restore-cancelled"}"`, env);
  const res = { statusCode: 200, body: undefined as any, status(n: number) { this.statusCode = n; return this; }, json(body: unknown) { this.body = body; return this; } };
  return { state, queued, release, res, run: () => run({ body: patchBody ?? {} }, res) };
}

for (const operation of ["cancel", "restore"] as const) {
  for (const change of ["closed stage", "missing stage", "closed tournament", "completed result"] as const) {
    test(`${operation}: current locked ${change} rejects queued operation with zero writes`, { timeout: 2000 }, async () => {
      const f = lifecycle(operation);
      const running = f.run();
      await f.queued.promise;
      if (change === "closed stage") f.state.stage = "completed";
      if (change === "missing stage") f.state.stage = undefined;
      if (change === "closed tournament") f.state.tournament = "completed";
      if (change === "completed result") f.state.match.resultType = "played";
      f.release.resolve(); await running;
      assert.equal(f.res.statusCode, 422);
      assert.equal(f.state.writes, 0);
    });
  }
  test(`${operation}: valid active stage permits the existing operation`, async () => {
    const f = lifecycle(operation); f.release.resolve(); await f.run();
    assert.equal(f.res.statusCode, 200); assert.ok(f.state.writes > 0);
  });
}
test("generic PATCH cannot bypass dedicated cancellation", async () => {
  const f = lifecycle("cancel", { status: "cancelled" });
  await f.run();
  assert.equal(f.res.statusCode, 422);
  assert.equal(f.res.body.code, "MATCH_CANCELLATION_REQUIRES_DEDICATED_ACTION");
  assert.equal(f.state.writes, 0);
});
test("generic PATCH cannot restore a match cancelled while the request waited", async () => {
  const f = lifecycle("cancel", { status: "pending" }); const running = f.run();
  await f.queued.promise; f.state.match.status = "cancelled"; f.release.resolve(); await running;
  assert.equal(f.res.statusCode, 422); assert.equal(f.res.body.code, "CANCELLED_MATCH_PATCH_FORBIDDEN");
  assert.equal(f.state.writes, 0);
});
test("duplicate cancellation is a 409 conflict", () => {
  assert.throws(() => assertCancelRestoreState("cancel", {
    status: "cancelled", resultType: null, completedAt: null, winnerId: null,
  }, "active", "active"), (error: unknown) => {
    assert.ok(error instanceof MatchLifecycleConflict); assert.equal(error.status, 409); return true;
  });
});

const authStart = auth.indexOf("function revalidateLockedOrganizer(");
const authHelper = auth.slice(authStart, auth.indexOf("\nfunction extractSupportToken", authStart));
class RevokedOrganizer extends Error { readonly status = 403; }
for (const endpoint of ["change-support-password", "change-viewer-password", "change-visibility", "viewer-password"]) {
  test(`${endpoint}: organizer revoked while waiting cannot write or audit`, async () => {
    let writes = 0, audits = 0;
    const revalidateLockedOrganizer = compile(authHelper, {
      verifyOrganizerToken: (token: string, _id: number, current: string) => token === current,
      TournamentMutationAuthorizationError: RevokedOrganizer,
    }, "revalidateLockedOrganizer");
    const queued = deferred(), release = deferred();
    const row = { organizerPasswordHash: "synthetic-old", viewerPasswordVersion: 1, supportPasswordVersion: 1, visibility: "public_online" };
    const query: any = { from() { return query; }, where() { return query; }, for: async () => { queued.resolve(); await release.promise; return [row]; } };
    const tx = { select: () => query, update: () => { writes++; throw new Error("must not write"); } };
    const run = handler(auth, `${endpoint === "viewer-password" ? "delete" : "post"}("/tournaments/:id/auth/${endpoint}"`, {
      db: { transaction: async (fn: any) => fn(tx) }, tournamentsTable, eq,
      parseId: () => 7, requireOrganizerAccess: async () => ({ actor: { type: "organizer" } }),
      hashPassword: async () => "synthetic-password-hash", NEW_CREDENTIAL_MIN_LENGTH: 8,
      revalidateLockedOrganizer, logAuditAction: async () => { audits++; },
    });
    const pending = run({
      headers: { "x-organizer-token": "synthetic-old" },
      body: { newPassword: "synthetic-password", visibility: "public_online" },
    }, { json() {} });
    const rejected = assert.rejects(pending, RevokedOrganizer);
    await queued.promise; row.organizerPasswordHash = "synthetic-rotated"; release.resolve(); await rejected;
    assert.equal(writes, 0); assert.equal(audits, 0);
  });
}

test("terminal RR reopen updates only members of that stage, not earlier eliminated players", async () => {
  const source = readFileSync(new URL("../src/application/matches/revert-match.ts", import.meta.url), "utf8");
  const from = source.indexOf("const reactivatedPlayers =", source.indexOf("if (!isSingleStageTournament && shouldReopenRoundRobin)"));
  const statement = source.slice(from, source.indexOf("reactivatedWinner =", from));
  let where: any;
  const update: any = { set() { return update; }, where(condition: unknown) { where = condition; return update; }, returning: async () => [] };
  const qb = new QueryBuilder();
  const execute = compile("async function run() {" + statement + "}", {
    tx: { update: () => update, select: qb.select.bind(qb) },
    playersTable, stageParticipantsTable, and, eq, inArray,
    tournament: { id: 7 }, stage: { id: 31 },
  }, "run");
  await execute();
  const rendered = new PgDialect().sqlToQuery(where);
  assert.match(rendered.sql, /"players"\."id" in \(select/);
  assert.match(rendered.sql, /"stage_participants"\."stage_id"/);
  assert.deepEqual(rendered.params, [7, 31]);
});
