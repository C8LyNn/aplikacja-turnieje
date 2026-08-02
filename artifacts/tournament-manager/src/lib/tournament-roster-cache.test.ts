import assert from "node:assert/strict";
import test from "node:test";
import {
  getGetTournamentStageQueryKey,
  getGetTournamentStageReadinessQueryKey,
  getGetTournamentStatsQueryKey,
  getListPlayersQueryKey,
  getListTournamentStagesQueryKey,
} from "@workspace/api-client-react";
import {
  invalidateTournamentRosterQueries,
  tournamentRosterQueryKeys,
} from "./tournament-roster-cache";

test("roster cache keys include participants, stage data and readiness for every stage", () => {
  assert.deepEqual(tournamentRosterQueryKeys(41, [11, 12]), [
    getListPlayersQueryKey(41),
    getGetTournamentStatsQueryKey(41),
    getListTournamentStagesQueryKey(41),
    getGetTournamentStageQueryKey(41, 11),
    getGetTournamentStageReadinessQueryKey(41, 11),
    getGetTournamentStageQueryKey(41, 12),
    getGetTournamentStageReadinessQueryKey(41, 12),
  ]);
});

test("add, delete, import and seeding mutations can invalidate the same precise roster dependencies", async () => {
  for (const mutation of ["add", "delete", "import", "seeding"]) {
    const calls: unknown[] = [];
    await invalidateTournamentRosterQueries({
      invalidateQueries: async (filters: unknown) => {
        calls.push(filters);
      },
    } as never, 41, [11]);
    assert.equal(calls.length, 5, mutation);
    assert.deepEqual(calls.at(-1), { queryKey: getGetTournamentStageReadinessQueryKey(41, 11) }, mutation);
  }
});
