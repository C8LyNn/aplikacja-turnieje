import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";
import {
  invalidateTournamentDependentQueries,
  isTournamentStageQuery,
} from "./tournament-query-invalidation";

test("recognizes every list/detail/qualification stage key for one tournament", () => {
  assert.equal(isTournamentStageQuery(["/api/tournaments/7/stages"], 7), true);
  assert.equal(isTournamentStageQuery(["/api/tournaments/7/stages/2"], 7), true);
  assert.equal(isTournamentStageQuery(["/api/tournaments/7/stages/2/qualification-preview"], 7), true);
  assert.equal(isTournamentStageQuery(["/api/tournaments/8/stages"], 7), false);
});

test("invalidates stage and tournament-dependent caches without touching another tournament", async (t) => {
  const client = new QueryClient();
  t.after(() => client.clear());
  const ownKeys = [
    ["/api/tournaments/7"],
    ["/api/tournaments/7/players"],
    ["/api/tournaments/7/matches"],
    ["/api/tournaments/7/stages"],
    ["/api/tournaments/7/stages/2"],
    ["/api/tournaments/7/stages/2/qualification-preview"],
  ] as const;
  for (const key of ownKeys) client.setQueryData(key, { ok: true });
  const foreignKey = ["/api/tournaments/8/stages"] as const;
  client.setQueryData(foreignKey, { ok: true });

  await invalidateTournamentDependentQueries(client, 7);

  for (const key of ownKeys)
    assert.equal(client.getQueryState(key)?.isInvalidated, true, String(key));
  assert.equal(client.getQueryState(foreignKey)?.isInvalidated, false);
});

for (const mutation of ["add", "edit", "delete", "merge", "replace", "undo"] as const) {
  test(`${mutation} roster mutation invalidates tournament, roster, matches and every stage cache`, async (t) => {
    const client = new QueryClient();
    t.after(() => client.clear());
    const keys = [
      ["/api/tournaments/9"],
      ["/api/tournaments/9/players"],
      ["/api/tournaments/9/matches"],
      ["/api/tournaments/9/standings"],
      ["/api/tournaments/9/stats"],
      ["/api/tournaments/9/bracket"],
      ["/api/tournaments/9/results-history"],
      ["/api/tournaments/9/assistant"],
      ["/api/tournaments/9/stages"],
      ["/api/tournaments/9/stages/3"],
      ["/api/tournaments/9/stages/3/qualification-preview"],
    ] as const;
    for (const key of keys) client.setQueryData(key, { mutation });

    await invalidateTournamentDependentQueries(client, 9);

    for (const key of keys) {
      assert.equal(
        client.getQueryState(key)?.isInvalidated,
        true,
        `${mutation}: ${String(key)}`,
      );
    }
  });
}
