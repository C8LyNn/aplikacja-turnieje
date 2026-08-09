import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { SeedingCeremonyState } from "./seeding-ceremony-api";
import {
  isSequentialCeremonyReady,
  revealedCeremonyDraws,
  remainingWheelDraws,
  stageHasRandomCeremony,
  stageRequiresSequentialCeremony,
  visibleWheelDraws,
} from "./seeding-ceremony-view";

function ceremony(): SeedingCeremonyState {
  return {
    kind: "seeding_ceremony_v1",
    version: 1,
    stageId: 1,
    status: "in_progress",
    drawMode: "seed",
    entrySeedingPolicy: "random",
    placementPolicy: "standard_bracket",
    resultSeedingPolicy: "standings_order",
    revealOrder: "sequential",
    randomSeed: "test",
    placementRandomSeed: null,
    participantSignature: "participants",
    configurationSignature: "configuration",
    participantOrder: ["1", "2", "3"],
    draws: [
      {
        drawNumber: 1,
        participantKey: "1",
        playerId: 1,
        playerName: "A",
        seed: 2,
        placement: { kind: "standings", label: "Pozycja 2", position: 2 },
      },
      {
        drawNumber: 2,
        participantKey: "2",
        playerId: 2,
        playerName: "B",
        seed: 3,
        placement: { kind: "standings", label: "Pozycja 3", position: 3 },
      },
      {
        drawNumber: 3,
        participantKey: "3",
        playerId: 3,
        playerName: "C",
        seed: 1,
        placement: { kind: "standings", label: "Pozycja 1", position: 1 },
      },
    ],
    revealedCount: 1,
    preparedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    completedAt: null,
    appliedAt: null,
  };
}

describe("seeding ceremony view helpers", () => {
  test("detects every random ceremony variant", () => {
    assert.equal(stageHasRandomCeremony({ entrySeedingPolicy: "random", seedingPolicy: "standard_bracket" }), true);
    assert.equal(stageHasRandomCeremony({ entrySeedingPolicy: "preserve", seedingPolicy: "random_groups" }), true);
    assert.equal(stageHasRandomCeremony({ entrySeedingPolicy: "preserve", seedingPolicy: "random_bracket" }), true);
    assert.equal(stageHasRandomCeremony({ entrySeedingPolicy: "preserve", seedingPolicy: "snake_groups" }), false);
  });

  test("blocks only incomplete sequential ceremonies", () => {
    const stage = { entrySeedingPolicy: "random", seedingPolicy: "standard_bracket", randomRevealOrder: "sequential" };
    assert.equal(stageRequiresSequentialCeremony(stage), true);
    assert.equal(isSequentialCeremonyReady(stage, null), false);
    assert.equal(isSequentialCeremonyReady(stage, { status: "in_progress" }), false);
    assert.equal(isSequentialCeremonyReady(stage, { status: "completed" }), true);
    assert.equal(isSequentialCeremonyReady(stage, { status: "applied" }), true);
    assert.equal(isSequentialCeremonyReady({ ...stage, randomRevealOrder: "instant" }, null), true);
  });

  test("sorts only unrevealed wheel outcomes without mutating the audit", () => {
    const state = ceremony();
    const before = JSON.stringify(state.draws);
    const remaining = remainingWheelDraws(state);
    assert.deepEqual(remaining.map((draw) => draw.seed), [1, 3]);
    assert.equal(JSON.stringify(state.draws), before);
  });

  test("returns only persisted revealed results without mutating the audit", () => {
    const state = ceremony();
    const before = JSON.stringify(state.draws);
    const revealed = revealedCeremonyDraws(state);
    assert.deepEqual(revealed.map((draw) => draw.drawNumber), [1]);
    assert.notEqual(revealed, state.draws);
    assert.equal(JSON.stringify(state.draws), before);
  });
  test("keeps the pending result visible on wheels larger than 32 entries", () => {
    const base = ceremony();
    const draws = Array.from({ length: 40 }, (_, index) => ({
      ...base.draws[0],
      drawNumber: index + 1,
      participantKey: String(index + 1),
      playerId: index + 1,
      playerName: `Player ${index + 1}`,
      seed: index + 1,
      placement: { kind: "standings" as const, label: `Pozycja ${index + 1}`, position: index + 1 },
    }));
    const state = { ...base, draws, participantOrder: draws.map((draw) => draw.participantKey), revealedCount: 0 };
    const visible = visibleWheelDraws(state, 40);
    assert.equal(visible.length, 32);
    assert.equal(visible.at(-1)?.drawNumber, 40);
    assert.equal(new Set(visible.map((draw) => draw.drawNumber)).size, 32);
  });

});
