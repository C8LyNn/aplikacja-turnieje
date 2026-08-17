import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_MARVEL_TOURNAMENT_CONFIG,
  parseTournamentGameConfig,
  TournamentGameConfigError,
} from "@workspace/game-catalog";

test("Marvel game config applies the documented defaults", () => {
  assert.deepEqual(
    parseTournamentGameConfig({
      gameId: "marvel",
      configVersion: 1,
      config: {},
    }),
    {
      gameId: "marvel",
      configVersion: 1,
      config: DEFAULT_MARVEL_TOURNAMENT_CONFIG,
    },
  );
});

test("Marvel game config accepts custom elimination group rules", () => {
  assert.deepEqual(
    parseTournamentGameConfig({
      gameId: "marvel",
      configVersion: 1,
      config: {
        groupSize: 10,
        advancingCount: 3,
        killLimit: 25,
        regroupingStrategy: "manual",
      },
    }),
    {
      gameId: "marvel",
      configVersion: 1,
      config: {
        groupSize: 10,
        advancingCount: 3,
        killLimit: 25,
        regroupingStrategy: "manual",
      },
    },
  );
});

test("Marvel game config enforces advancing and kill limits", () => {
  for (const config of [
    { groupSize: 8, advancingCount: 8, killLimit: 20 },
    { groupSize: 8, advancingCount: 0, killLimit: 20 },
    { groupSize: 8, advancingCount: 4, killLimit: 0 },
  ]) {
    assert.throws(
      () =>
        parseTournamentGameConfig({
          gameId: "marvel",
          configVersion: 1,
          config,
        }),
      (error: unknown) =>
        error instanceof TournamentGameConfigError &&
        error.code === "INVALID_GAME_CONFIG",
    );
  }
});
