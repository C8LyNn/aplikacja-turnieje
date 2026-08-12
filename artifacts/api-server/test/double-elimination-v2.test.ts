import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  compileTournamentBlueprintV2,
  correctRoutingMatchResultV2,
  createRoutingExecutionV2,
  doubleEliminationFormatEngineV2,
  evaluateRoutingExecutionV2,
  recordRoutingMatchResultV2,
  resetRoutingExecutionV2,
  type CompiledTournamentRoutingPlanV2,
  type RoutingExecutionEvaluationV2,
} from "../src/domain/tournament/v2/index";
import { minimalBlueprint, requireCompiled } from "./tournament-routing-test-helpers";

function plan(participantCount: number): CompiledTournamentRoutingPlanV2 {
  return requireCompiled(
    compileTournamentBlueprintV2(
      minimalBlueprint("double_elimination", participantCount),
      [doubleEliminationFormatEngineV2],
    ),
  );
}

function participants(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `p${index + 1}`);
}

function playReady(
  compiled: CompiledTournamentRoutingPlanV2,
  state: RoutingExecutionEvaluationV2,
  winner: (match: RoutingExecutionEvaluationV2["matches"][number]) => string,
): RoutingExecutionEvaluationV2 {
  let current = state;
  for (;;) {
    const readyMatches = current.matches.filter((match) => match.status === "ready");
    const activeParticipants = readyMatches.flatMap((match) => match.slots.filter(
      (slot): slot is string => slot != null,
    ));
    assert.equal(
      new Set(activeParticipants).size,
      activeParticipants.length,
      "a participant cannot appear in two ready matches at once",
    );
    const ready = readyMatches[0];
    if (!ready) return current;
    current = recordRoutingMatchResultV2(
      compiled,
      current.snapshot,
      ready.matchKey,
      winner(ready),
    );
  }
}

describe("Double Elimination V2", () => {
  for (const count of [2, 3, 4, 5, 6, 7, 8, 9, 12, 16, 17, 24, 31, 32]) {
    test(`compiles and completes a deterministic ${count}-participant bracket`, () => {
      const compiled = plan(count);
      const initial = createRoutingExecutionV2(compiled, "playoff", participants(count));
      const completed = playReady(compiled, initial, (match) => match.slots[0]!);
      assert.equal(completed.completed, true);
      assert.ok(completed.championParticipantKey);
      assert.equal(new Set(completed.matches.map((match) => match.matchKey)).size, completed.matches.length);
      assert.equal(completed.participants.filter((participant) => participant.status === "winner").length, 1);
      assert.equal(completed.participants.filter((participant) => participant.losses >= 2).length, count - 1);
      assert.ok(completed.matches.every((match) => !match.slots.some(
        (participantKey, index) => participantKey != null && participantKey === match.slots[1 - index],
      )));
    });
  }

  for (const [name, winner] of [
    ["first", (match: RoutingExecutionEvaluationV2["matches"][number]) => match.slots[0]!],
    ["second", (match: RoutingExecutionEvaluationV2["matches"][number]) => match.slots[1]!],
    ["alternating", (match: RoutingExecutionEvaluationV2["matches"][number]) => match.slots[match.order % 2]!],
    ["lower-seed upset", (match: RoutingExecutionEvaluationV2["matches"][number]) =>
      [...match.slots].filter((slot): slot is string => slot != null)
        .sort((left, right) => Number(right.slice(1)) - Number(left.slice(1)))[0]!],
  ] as const) {
    test(`completes deterministically with the ${name} winner strategy`, () => {
      const compiled = plan(12);
      const completed = playReady(
        compiled,
        createRoutingExecutionV2(compiled, "playoff", participants(12)),
        winner,
      );
      assert.equal(completed.completed, true);
      assert.equal(completed.participants.filter((participant) => participant.status === "winner").length, 1);
      assert.equal(completed.participants.filter((participant) => participant.losses >= 2).length, 11);
    });
  }

  test("routes Upper winners, Upper losers and Lower winners without ghost participants", () => {
    const compiled = plan(8);
    let state = createRoutingExecutionV2(compiled, "playoff", participants(8));
    const upper = state.matches.filter((match) => match.name?.startsWith("Upper R1"));
    for (const match of upper) {
      state = recordRoutingMatchResultV2(compiled, state.snapshot, match.matchKey, match.slots[0]!);
    }
    const lowerReady = state.matches.filter(
      (match) => match.name?.startsWith("Lower R1") && match.status === "ready",
    );
    assert.equal(lowerReady.length, 2);
    assert.ok(lowerReady.every((match) => match.slots.every((slot) => slot != null)));
    assert.equal(new Set(lowerReady.flatMap((match) => match.slots)).size, 4);
    assert.ok(state.matches.some(
      (match) => match.name?.startsWith("Upper R2") && match.status === "ready",
    ));
  });

  test("gives 17 participants fifteen Upper BYEs and one played first-round match", () => {
    const compiled = plan(17);
    const state = createRoutingExecutionV2(compiled, "playoff", participants(17));
    const firstUpper = state.matches.filter((match) => match.name?.startsWith("Upper R1"));
    assert.equal(firstUpper.length, 16);
    assert.equal(firstUpper.filter((match) => match.status === "bye").length, 15);
    assert.equal(firstUpper.filter((match) => match.status === "ready").length, 1);
  });

  test("plays a Grand Final Reset only when the Lower winner wins Grand Final", () => {
    const compiled = plan(4);
    let state = createRoutingExecutionV2(compiled, "playoff", participants(4));
    while (!state.matches.some((match) => match.name === "Grand Final" && match.status === "ready")) {
      const ready = state.matches.find((match) => match.status === "ready")!;
      state = recordRoutingMatchResultV2(compiled, state.snapshot, ready.matchKey, ready.slots[0]!);
    }
    const grandFinal = state.matches.find((match) => match.name === "Grand Final")!;
    state = recordRoutingMatchResultV2(
      compiled,
      state.snapshot,
      grandFinal.matchKey,
      grandFinal.slots[1]!,
    );
    const reset = state.matches.find((match) => match.name === "Grand Final Reset")!;
    assert.equal(reset.status, "ready");
    assert.deepEqual(new Set(reset.slots), new Set(grandFinal.slots));
    state = recordRoutingMatchResultV2(compiled, state.snapshot, reset.matchKey, reset.slots[0]!);
    assert.equal(state.completed, true);
  });

  test("Upper winner closes Grand Final without a second played final", () => {
    const compiled = plan(4);
    let state = createRoutingExecutionV2(compiled, "playoff", participants(4));
    while (!state.matches.some((match) => match.name === "Grand Final" && match.status === "ready")) {
      const ready = state.matches.find((match) => match.status === "ready")!;
      state = recordRoutingMatchResultV2(compiled, state.snapshot, ready.matchKey, ready.slots[0]!);
    }
    const grandFinal = state.matches.find((match) => match.name === "Grand Final")!;
    state = recordRoutingMatchResultV2(
      compiled,
      state.snapshot,
      grandFinal.matchKey,
      grandFinal.slots[0]!,
    );
    assert.equal(state.completed, true);
    assert.equal(state.matches.find((match) => match.name === "Grand Final Reset")?.status, "bye");
  });

  test("correcting an Upper result changes the Lower entrant and invalidates downstream results", () => {
    const compiled = plan(4);
    let state = createRoutingExecutionV2(compiled, "playoff", participants(4));
    const upper = state.matches.find((match) => match.name === "Upper R1 M1")!;
    state = recordRoutingMatchResultV2(compiled, state.snapshot, upper.matchKey, upper.slots[0]!);
    const otherUpper = state.matches.find((match) => match.name === "Upper R1 M2")!;
    state = recordRoutingMatchResultV2(compiled, state.snapshot, otherUpper.matchKey, otherUpper.slots[0]!);
    const lower = state.matches.find((match) => match.name === "Lower R1 M1")!;
    const oldLowerEntrants = new Set(lower.slots);
    state = recordRoutingMatchResultV2(compiled, state.snapshot, lower.matchKey, lower.slots[0]!);
    state = correctRoutingMatchResultV2(compiled, state.snapshot, upper.matchKey, upper.slots[1]!);
    const correctedLower = state.matches.find((match) => match.name === "Lower R1 M1")!;
    assert.notDeepEqual(new Set(correctedLower.slots), oldLowerEntrants);
    assert.equal(correctedLower.status, "ready");
    assert.equal(state.snapshot.decisions.some((decision) => decision.matchKey === lower.matchKey), false);
  });

  test("correcting Lower and Grand Final results cascades safely, reset clears everything", () => {
    const compiled = plan(4);
    const completed = playReady(
      compiled,
      createRoutingExecutionV2(compiled, "playoff", participants(4)),
      (match) => match.slots[0]!,
    );
    const lower = completed.matches.find((match) => match.name === "Lower R1 M1")!;
    let corrected = correctRoutingMatchResultV2(
      compiled,
      completed.snapshot,
      lower.matchKey,
      lower.slots[1]!,
    );
    assert.equal(corrected.completed, false);
    const staleGrand = completed.matches.find((match) => match.name === "Grand Final")!;
    assert.equal(
      corrected.snapshot.decisions.some((decision) => decision.matchKey === staleGrand.matchKey),
      false,
    );
    corrected = playReady(compiled, corrected, (match) => match.slots[0]!);
    const grand = corrected.matches.find((match) => match.name === "Grand Final")!;
    corrected = correctRoutingMatchResultV2(
      compiled,
      corrected.snapshot,
      grand.matchKey,
      grand.slots[1]!,
    );
    assert.equal(corrected.completed, false);
    assert.equal(corrected.matches.find((match) => match.name === "Grand Final Reset")?.status, "ready");
    const reset = resetRoutingExecutionV2(compiled, corrected.snapshot);
    assert.equal(reset.snapshot.decisions.length, 0);
    assert.equal(reset.completed, false);
    assert.ok(reset.participants.every((participant) => participant.losses === 0));
  });

  test("snapshot round-trip is deterministic and contains no duplicate or ghost participant", () => {
    const compiled = plan(5);
    let state = createRoutingExecutionV2(compiled, "playoff", participants(5));
    const ready = state.matches.find((match) => match.status === "ready")!;
    state = recordRoutingMatchResultV2(compiled, state.snapshot, ready.matchKey, ready.slots[0]!);
    const reloaded = evaluateRoutingExecutionV2(
      compiled,
      JSON.parse(JSON.stringify(state.snapshot)),
    );
    assert.deepEqual(reloaded, state);
    const known = new Set(participants(5));
    assert.ok(reloaded.matches.flatMap((match) => match.slots).every(
      (participantKey) => participantKey == null || known.has(participantKey),
    ));
  });
});
