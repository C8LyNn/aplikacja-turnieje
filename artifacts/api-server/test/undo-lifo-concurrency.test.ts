import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { transformSync } from "esbuild";
import { and, desc, eq, sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { actionLogTable, matchesTable, playersTable, tournamentsTable, matchGamePicksTable } from "@workspace/db/schema";
import { lockLatestUndoableAction, UndoActionChangedError } from "../src/application/undo/latest-undo-action";
import { parseRosterUndoPayload } from "../src/application/players/roster-undo-payload";

// Execute the actual HTTP handler and roster function without importing the
// application bootstrap/database pool. Only their external ports are replaced.
// This tests controlled interleaving, not PostgreSQL lock/isolation semantics.
const routeSource = readFileSync(new URL("../src/routes/tournaments.ts", import.meta.url), "utf8");
const rosterSource = readFileSync(new URL("../src/application/players/tournament-roster.ts", import.meta.url), "utf8");
function section(source: string, start: string, end: string) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `Source section exists: ${start}`);
  return source.slice(from, to);
}
function compile(source: string, env: Record<string, unknown>, result: string): any {
  const { code } = transformSync(source.replace(/^export /gm, ""), { loader: "ts", target: "es2022" });
  return new Function(...Object.keys(env), `${code}\nreturn ${result};`)(...Object.values(env));
}
const routeStart = routeSource.indexOf('router.post("/tournaments/:id/undo-last"');
const routeText = routeSource.slice(routeStart, routeSource.indexOf("\n});", routeStart) + 5);
const handlerText = "const handler = " + routeText.slice(routeText.indexOf("async"), routeText.lastIndexOf("});") + 1) + ";";
const rosterText = section(rosterSource, "export async function undoTournamentRosterAction", "export interface CsvRowError");
const rosterErrorText = section(rosterSource, "export class TournamentRosterError", "type PlayerInsert");
const rosterErrorMessages = section(rosterSource, "const ERROR_MESSAGES:", "export class TournamentRosterError");
const TournamentRosterError = compile(rosterErrorMessages + rosterErrorText, {}, "TournamentRosterError");
const sendTournamentRosterError = compile(
  section(routeSource, "function sendTournamentRosterError(", "function formatDate("),
  {}, "sendTournamentRosterError",
);
class RevertMatchError extends Error {
  constructor(public code: string) { super(code); }
}
const sendRevertMatchError = compile(
  section(routeSource, "function sendRevertMatchError(", "// ========== ACTION LOG ROUTES"),
  {}, "sendRevertMatchError",
);

type Action = typeof actionLogTable.$inferSelect;
const at = new Date("2026-10-30T00:00:00Z");
function action(id: number, type: string, payload: Record<string, unknown>, tournamentId = 7): Action {
  return {
    id, tournamentId, actionType: type, description: type, matchId: 11, stageId: null,
    undoPayload: JSON.stringify(payload), isUndone: false, createdAt: at,
  };
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(r => { resolve = r; });
  return { promise, resolve };
}

function fixture(candidate: Action, blocked = false) {
  const queued = deferred(), release = deferred();
  const state = { actions: [candidate], player: "newer name", score: 3, writes: 0, revertCalls: 0 };
  const reads: string[] = [];
  let held = false;
  const tx: any = {
    select() {
      let where: any;
      let table: unknown;
      const query: any = {
        from(selectedTable: unknown) {
          assert.ok(selectedTable === actionLogTable || selectedTable === playersTable);
          table = selectedTable;
          return query;
        },
        where(expression: any) { where = expression; return query; },
        orderBy(...expressions: any[]) {
          const order = expressions.map(e => new PgDialect().sqlToQuery(e).sql);
          assert.match(order[0], /"created_at" desc$/);
          assert.match(order[1], /"id" desc$/);
          return query;
        },
        limit(n: number) { assert.equal(n, 1); return query; },
        for(mode: string) {
          assert.equal(mode, "update");
          assert.equal(held, true, "latest action is read only after the tournament lock");
          reads.push(table === actionLogTable ? "locked-latest" : "locked-player");
          return query;
        },
        then(resolve: (v: any[]) => void, reject: (e: unknown) => void) {
          try {
            const rendered = new PgDialect().sqlToQuery(where);
            assert.match(rendered.sql, /"tournament_id"/);
            if (table === playersTable) {
              assert.deepEqual(rendered.params, [27, 7]);
              resolve([{ id: 27, tournamentId: 7, name: state.player }]);
              return;
            }
            assert.match(rendered.sql, /"is_undone"/);
            assert.match(rendered.sql, /"undo_payload" IS NOT NULL/);
            assert.equal(rendered.params[1], false);
            const rows = state.actions.filter(a => a.tournamentId === rendered.params[0] && !a.isUndone && a.undoPayload !== null)
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id);
            resolve(rows.slice(0, 1));
          } catch (error) { reject(error); }
        },
      };
      return query;
    },
    update() {
      assert.ok(held);
      state.writes++;
      const write: any = {
        set() { return write; }, where() { return write; },
        returning: async () => [{ ...candidate, isUndone: true }],
        then(resolve: (v: unknown[]) => void) { resolve([]); },
      };
      return write;
    },
    insert() { state.writes++; return { values: async () => undefined }; },
    delete() { state.writes++; return { where: async () => undefined }; },
  };
  const db = {
    select: tx.select,
    async transaction(operation: (t: any) => Promise<unknown>) {
      queued.resolve();
      if (blocked) await release.promise;
      assert.equal(held, false);
      held = true;
      try { return await operation(tx); }
      finally { held = false; }
    },
  };
  const undoTournamentRosterAction = compile(rosterText, {
    db, actionLogTable, playersTable, and, eq, parseRosterUndoPayload,
    lockLatestUndoableAction, UndoActionChangedError, TournamentRosterError,
    lockDraftTournament: async (t: unknown) => { assert.equal(t, tx); assert.ok(held); },
    assertUniqueName: async () => undefined,
  }, "undoTournamentRosterAction");
  const handler = compile(handlerText, {
    db, actionLogTable, matchesTable, playersTable, tournamentsTable, matchGamePicksTable,
    and, eq, desc, sql, lockLatestUndoableAction, UndoActionChangedError,
    UndoLastActionParams: { safeParse: () => ({ success: true, data: { id: 7 } }) },
    requireTournamentWrite: async () => ({ actor: { type: "organizer" } }),
    getTournamentMutationActor: () => ({ type: "organizer" }),
    withTournamentMutationLock: async (_id: number, _actor: unknown, operation: any) => db.transaction(operation),
    undoTournamentRosterAction, TournamentRosterError, sendTournamentRosterError,
    RevertMatchError, sendRevertMatchError,
    revertMatch: async (_input: unknown, _hooks: unknown, suppliedTx: unknown) => {
      assert.equal(suppliedTx, tx, "result Undo must reuse the guarded transaction");
      assert.ok(held);
      assert.ok(reads.includes("locked-latest"));
      state.revertCalls++; state.writes++; state.score = 0;
      return { completionAction: candidate };
    },
    logAction: async (_entry: unknown, suppliedTx: unknown) => {
      assert.equal(suppliedTx, tx); state.writes++;
    },
    mapActionLog: (row: unknown) => row,
  }, "handler");
  const response = {
    statusCode: 200, body: undefined as any,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
  };
  return { state, tx, db, handler, response, queued, release, reads };
}

const variants: [string, string, Record<string, unknown>][] = [
  ["roster add", "player_added", { type: "delete_player", playerId: 27 }],
  ["roster edit", "player_edited", { type: "restore_player", playerId: 27, prevData: { name: "old name" } }],
  ["match result", "match_result_submitted", { type: "revert_match", matchId: 11 }],
  ["status", "match_started", { type: "restore_status", matchId: 11, prevStatus: "pending" }],
  ["best of", "match_bo_changed", { type: "restore_best_of", matchId: 11, prevBestOf: 3 }],
  ["featured", "match_featured", { type: "restore_featured", prevFeaturedMatchId: null }],
  ["cancel", "match_cancelled", { type: "restore_cancelled_match", matchId: 11, prevStatus: "pending", prevNote: null }],
  ["swap", "match_players_swapped", { type: "restore_players_swap", matchId: 11, player1Id: 1, player2Id: 2 }],
];
for (const [name, kind, payload] of variants) {
  test(`HTTP Undo ${name}: a newer action committed while waiting gives 409 and zero writes`, { timeout: 2000 }, async () => {
    const f = fixture(action(10, kind, payload), true);
    const running = f.handler({}, f.response);
    await f.queued.promise; // Candidate A has already been selected, lock is still held by writer B.
    f.state.actions.push(action(11, "player_edited", { type: "restore_player", playerId: 27, prevData: { name: "B" } }));
    const committed = structuredClone(f.state);
    f.release.resolve();
    await running;
    assert.equal(f.response.statusCode, 409);
    assert.equal(f.response.body.code, "UNDO_ACTION_CHANGED");
    assert.deepEqual(f.state, committed, "do not touch players, results, journal or isUndone on conflict");
    assert.equal(f.state.writes, 0);
    assert.equal(f.state.revertCalls, 0);
    assert.deepEqual(f.reads, ["locked-latest"]);
  });
}

for (const [name, kind, payload] of variants) {
  test(`HTTP Undo ${name}: unchanged candidate succeeds under the same transaction`, async () => {
    const f = fixture(action(10, kind, payload));
    await f.handler({}, f.response);
    assert.equal(f.response.statusCode, 200);
    assert.ok(f.state.writes > 0);
    assert.deepEqual(f.reads, name.startsWith("roster") ? ["locked-latest", "locked-player"] : ["locked-latest"]);
  });
}

test("latest guard ignores other tournaments, undone rows and entries with no Undo payload", async () => {
  const f = fixture(action(10, "match_started", { type: "restore_status" }));
  f.state.actions.push(
    action(99, "player_added", { type: "delete_player" }, 8),
    { ...action(98, "match_started", {}), isUndone: true },
    { ...action(97, "audit", {}), undoPayload: null },
  );
  const result = await f.db.transaction(t => lockLatestUndoableAction(t, 7, 10));
  assert.equal((result as Action).id, 10);
  assert.equal(f.state.writes, 0);
});

for (const replacement of ["undone", "removed", "later timestamp"] as const) {
  test(`latest guard rejects candidate ${replacement} after selection`, async () => {
    const f = fixture(action(10, "match_started", { type: "restore_status" }));
    if (replacement === "undone") f.state.actions[0].isUndone = true;
    if (replacement === "removed") f.state.actions.length = 0;
    if (replacement === "later timestamp") {
      f.state.actions.push({ ...action(9, "match_started", {}), createdAt: new Date(at.getTime() + 1) });
    }
    await assert.rejects(f.db.transaction(t => lockLatestUndoableAction(t, 7, 10)), (error: unknown) => {
      assert.ok(error instanceof UndoActionChangedError);
      assert.equal(error.status, 409);
      return true;
    });
    assert.equal(f.state.writes, 0);
  });
}
