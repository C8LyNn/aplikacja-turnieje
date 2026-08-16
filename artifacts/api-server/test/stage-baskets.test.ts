import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  validateStageBasketConfiguration,
  type StageBasketConfigurationInput,
} from "../src/domain/tournament/stage-baskets";

// Helper: run validation in legacy mode (default) — allows null on output baskets.
function codes(input: StageBasketConfigurationInput): string[] {
  return validateStageBasketConfiguration(input).problems.map(
    (problem) => problem.code,
  );
}

// Helper: run validation in explicit mode — every output basket must carry a
// positive qualifierCount. Use for PUT and Backup V3 restore paths.
function explicitCodes(input: StageBasketConfigurationInput): string[] {
  return validateStageBasketConfiguration(input, "explicit").problems.map(
    (problem) => problem.code,
  );
}

function validConfiguration(): StageBasketConfigurationInput {
  return {
    stages: [
      { id: 11, position: 1, participantCount: 8 },
      { id: 22, position: 2, participantCount: 4 },
    ],
    playerIds: [1, 2, 3, 4],
    baskets: [
      {
        id: "s1-in",
        stageId: 11,
        type: "input",
        ordinal: 1,
        order: 1,
        colorId: null,
        participantIds: [1, 2],
        qualifierCount: null,
      },
      {
        id: "s1-out",
        stageId: 11,
        type: "output",
        ordinal: 1,
        order: 1,
        colorId: "blue",
        participantIds: [],
        qualifierCount: 4,
      },
      {
        id: "s2-in",
        stageId: 22,
        type: "input",
        ordinal: 1,
        order: 1,
        colorId: null,
        participantIds: [3, 4],
        qualifierCount: null,
      },
      {
        id: "s2-out",
        stageId: 22,
        type: "output",
        ordinal: 1,
        order: 1,
        colorId: null,
        participantIds: [],
        qualifierCount: null,
      },
    ],
    routes: [
      { id: "s1-to-s2", sourceBasketId: "s1-out", targetBasketId: "s2-in" },
    ],
  };
}

describe("stage basket domain validation", () => {
  test("accepts a forward one-input/one-output graph", () => {
    assert.deepEqual(validateStageBasketConfiguration(validConfiguration()), {
      valid: true,
      problems: [],
    });
  });

  test("accepts four input and four output baskets", () => {
    const input = validConfiguration();
    input.baskets = [1, 2, 3, 4].flatMap((ordinal) => [
      {
        id: `s1-in-${ordinal}`,
        stageId: 11,
        type: "input" as const,
        ordinal,
        order: ordinal,
        colorId: null,
        participantIds: [ordinal],
        qualifierCount: null,
      },
      {
        id: `s1-out-${ordinal}`,
        stageId: 11,
        type: "output" as const,
        ordinal,
        order: ordinal,
        colorId: null,
        participantIds: [],
        qualifierCount: 2,
      },
      {
        id: `s2-in-${ordinal}`,
        stageId: 22,
        type: "input" as const,
        ordinal,
        order: ordinal,
        colorId: null,
        participantIds: [],
        qualifierCount: null,
      },
      {
        id: `s2-out-${ordinal}`,
        stageId: 22,
        type: "output" as const,
        ordinal,
        order: ordinal,
        colorId: null,
        participantIds: [],
        qualifierCount: null,
      },
    ]);
    input.routes = [1, 2, 3, 4].map((ordinal) => ({
      id: `route-${ordinal}`,
      sourceBasketId: `s1-out-${ordinal}`,
      targetBasketId: `s2-in-${ordinal}`,
    }));
    assert.equal(validateStageBasketConfiguration(input).valid, true);
  });

  test("rejects a fifth input basket", () => {
    const input = validConfiguration();
    input.baskets = [
      ...input.baskets,
      ...[2, 3, 4, 5].map((ordinal) => ({
        id: `s1-in-${ordinal}`,
        stageId: 11,
        type: "input" as const,
        ordinal,
        order: ordinal,
        colorId: null,
        participantIds: [],
        qualifierCount: null,
      })),
    ];
    assert.ok(codes(input).includes("STAGE_INPUT_BASKET_COUNT_INVALID"));
  });

  test("rejects same-stage and backward routes", () => {
    const same = validConfiguration();
    same.routes = [
      { id: "same", sourceBasketId: "s1-out", targetBasketId: "s1-in" },
    ];
    assert.ok(codes(same).includes("STAGE_BASKET_ROUTE_NOT_FORWARD"));
    const backward = validConfiguration();
    backward.routes = [
      { id: "back", sourceBasketId: "s2-out", targetBasketId: "s1-in" },
    ];
    assert.ok(codes(backward).includes("STAGE_BASKET_ROUTE_NOT_FORWARD"));
  });

  test("rejects a reused output and duplicate participant", () => {
    const input = validConfiguration();
    input.baskets = [
      ...input.baskets,
      {
        id: "s2-in-2",
        stageId: 22,
        type: "input",
        ordinal: 2,
        order: 2,
        colorId: null,
        participantIds: [3],
        qualifierCount: null,
      },
    ];
    input.routes = [
      { id: "route-a", sourceBasketId: "s1-out", targetBasketId: "s2-in" },
      { id: "route-b", sourceBasketId: "s1-out", targetBasketId: "s2-in-2" },
    ];
    const found = codes(input);
    assert.ok(found.includes("STAGE_BASKET_ROUTE_OUTPUT_REUSED"));
    assert.ok(found.includes("STAGE_BASKET_PARTICIPANT_DUPLICATE"));
  });

  test("rejects missing baskets, duplicate ordinals and invalid participant references", () => {
    const input = validConfiguration();
    input.baskets = [
      ...input.baskets,
      {
        id: "s1-in-two",
        stageId: 11,
        type: "input",
        ordinal: 1,
        order: 2,
        colorId: null,
        participantIds: [999],
        qualifierCount: null,
      },
    ];
    input.routes = [
      {
        id: "missing",
        sourceBasketId: "missing-output",
        targetBasketId: "missing-input",
      },
    ];
    const found = codes(input);
    assert.ok(found.includes("STAGE_BASKET_ORDINAL_DUPLICATE"));
    assert.ok(found.includes("STAGE_BASKET_PARTICIPANT_NOT_FOUND"));
    assert.ok(found.includes("STAGE_BASKET_ROUTE_SOURCE_NOT_FOUND"));
    assert.ok(found.includes("STAGE_BASKET_ROUTE_TARGET_NOT_FOUND"));
  });

  // ─── qualifierCount validation ───────────────────────────────────────────

  test("rejects non-null qualifierCount on an input basket", () => {
    const input = validConfiguration();
    // Mutate s1-in to have a non-null qualifierCount
    input.baskets = input.baskets.map((b) =>
      b.id === "s1-in" ? { ...b, qualifierCount: 2 } : b,
    );
    assert.ok(codes(input).includes("STAGE_INPUT_BASKET_QUALIFIER_COUNT_NOT_ALLOWED"));
  });

  test("rejects zero or negative qualifierCount on an output basket", () => {
    const input = validConfiguration();
    input.baskets = input.baskets.map((b) =>
      b.id === "s1-out" ? { ...b, qualifierCount: 0 } : b,
    );
    assert.ok(codes(input).includes("STAGE_OUTPUT_BASKET_QUALIFIER_COUNT_INVALID"));

    const input2 = validConfiguration();
    input2.baskets = input2.baskets.map((b) =>
      b.id === "s1-out" ? { ...b, qualifierCount: -3 } : b,
    );
    assert.ok(codes(input2).includes("STAGE_OUTPUT_BASKET_QUALIFIER_COUNT_INVALID"));
  });

  test("rejects non-integer qualifierCount on an output basket", () => {
    const input = validConfiguration();
    input.baskets = input.baskets.map((b) =>
      b.id === "s1-out" ? { ...b, qualifierCount: 1.5 } : b,
    );
    assert.ok(codes(input).includes("STAGE_OUTPUT_BASKET_QUALIFIER_COUNT_INVALID"));
  });

  test("accepts null qualifierCount on output baskets (legacy implicit case)", () => {
    const input = validConfiguration();
    input.baskets = input.baskets.map((b) =>
      b.type === "output" ? { ...b, qualifierCount: null } : b,
    );
    assert.equal(validateStageBasketConfiguration(input).valid, true);
  });

  test("accepts when sum of output qualifierCounts equals participantCount", () => {
    const input: StageBasketConfigurationInput = {
      stages: [{ id: 1, position: 1, participantCount: 32 }],
      playerIds: [],
      baskets: [
        { id: "in-1", stageId: 1, type: "input", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: null },
        { id: "out-1", stageId: 1, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: 4 },
        { id: "out-2", stageId: 1, type: "output", ordinal: 2, order: 2, colorId: null, participantIds: [], qualifierCount: 8 },
      ],
      routes: [],
    };
    // sum = 12 <= 32 ✓
    assert.equal(validateStageBasketConfiguration(input).valid, true);
  });

  test("accepts when sum of output qualifierCounts is less than participantCount (remainder eliminated)", () => {
    const input: StageBasketConfigurationInput = {
      stages: [{ id: 1, position: 1, participantCount: 32 }],
      playerIds: [],
      baskets: [
        { id: "in-1", stageId: 1, type: "input", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: null },
        { id: "out-1", stageId: 1, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: 4 },
        { id: "out-2", stageId: 1, type: "output", ordinal: 2, order: 2, colorId: null, participantIds: [], qualifierCount: 8 },
      ],
      routes: [],
    };
    // 4 + 8 = 12 < 32 → 20 are eliminated; valid
    assert.equal(validateStageBasketConfiguration(input).valid, true);
  });

  test("rejects when sum of output qualifierCounts exceeds participantCount", () => {
    const input: StageBasketConfigurationInput = {
      stages: [{ id: 1, position: 1, participantCount: 10 }],
      playerIds: [],
      baskets: [
        { id: "in-1", stageId: 1, type: "input", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: null },
        { id: "out-1", stageId: 1, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: 6 },
        { id: "out-2", stageId: 1, type: "output", ordinal: 2, order: 2, colorId: null, participantIds: [], qualifierCount: 8 },
      ],
      routes: [],
    };
    // 6 + 8 = 14 > 10 → error
    assert.ok(codes(input).includes("STAGE_OUTPUT_BASKET_QUOTA_EXCEEDS_PARTICIPANT_COUNT"));
  });

  test("sum constraint counts only non-null qualifierCounts", () => {
    // Mix: one output with quota, one with null → sum = quota of the non-null one
    const input: StageBasketConfigurationInput = {
      stages: [{ id: 1, position: 1, participantCount: 5 }],
      playerIds: [],
      baskets: [
        { id: "in-1", stageId: 1, type: "input", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: null },
        { id: "out-1", stageId: 1, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: 3 },
        { id: "out-2", stageId: 1, type: "output", ordinal: 2, order: 2, colorId: null, participantIds: [], qualifierCount: null },
      ],
      routes: [],
    };
    // sum of non-null = 3 <= 5 ✓
    assert.equal(validateStageBasketConfiguration(input).valid, true);
  });

  // ─── explicit vs legacy mode ─────────────────────────────────────────────────

  test("explicit mode rejects output basket with null qualifierCount", () => {
    const input = validConfiguration();
    // s2-out has qualifierCount: null (terminal stage — valid in legacy mode).
    assert.ok(
      explicitCodes(input).includes("STAGE_OUTPUT_BASKET_QUALIFIER_COUNT_REQUIRED"),
      "explicit mode must reject output with null qualifierCount",
    );
  });

  test("explicit mode accepts configuration where all output baskets have positive qualifierCount", () => {
    const input = validConfiguration();
    // Set non-null qualifierCount on the terminal output basket.
    input.baskets = input.baskets.map((b) =>
      b.id === "s2-out" ? { ...b, qualifierCount: 2 } : b,
    );
    assert.equal(
      validateStageBasketConfiguration(input, "explicit").valid,
      true,
      "explicit mode must accept all-positive-quota configuration",
    );
  });

  test("legacy mode accepts null qualifierCount on output baskets", () => {
    const input = validConfiguration();
    // s2-out already has null (terminal stage); make both outputs null.
    input.baskets = input.baskets.map((b) =>
      b.type === "output" ? { ...b, qualifierCount: null } : b,
    );
    assert.equal(
      validateStageBasketConfiguration(input).valid,
      true,
      "legacy mode must allow null qualifierCount on output baskets",
    );
    // The same input must be invalid in explicit mode.
    assert.ok(
      explicitCodes(input).includes("STAGE_OUTPUT_BASKET_QUALIFIER_COUNT_REQUIRED"),
      "explicit mode must reject the same null-output basket",
    );
  });

  test("legacy terminal stage implicit output with null qualifierCount is valid in legacy mode", () => {
    const input: StageBasketConfigurationInput = {
      stages: [{ id: 1, position: 1, participantCount: 8 }],
      playerIds: [],
      baskets: [
        { id: "in-1", stageId: 1, type: "input", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: null },
        // Terminal output: qualifierCount = null (no stage to advance to).
        { id: "out-1", stageId: 1, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: null },
      ],
      routes: [],
    };
    assert.equal(validateStageBasketConfiguration(input).valid, true, "legacy mode");
    assert.ok(
      explicitCodes(input).includes("STAGE_OUTPUT_BASKET_QUALIFIER_COUNT_REQUIRED"),
      "explicit mode must still reject null",
    );
  });

  /**
   * PHASE 2 GUARD — Legacy group stage with ambiguous advancingCount.
   *
   * When a legacy (legacyDefaulted=true) stage has advancingCount = null
   * (e.g. a group stage whose advancing count derives from group parameters),
   * the application layer derives qualifierCount = null for the output basket.
   *
   * This null MUST remain in legacy mode only and must NEVER be treated as a
   * valid explicit runtime quota by Phase 2+ runtime basket transfer logic.
   *
   * If this test starts failing it means either:
   *   a) legacy mode was tightened to reject null (breaking backward compat), or
   *   b) the fixture was changed to supply a non-null qualifierCount (acceptable).
   * Either way it requires a deliberate decision — not a silent fix.
   */
  test("legacy group-stage implicit output with null qualifierCount remains valid in legacy mode and invalid in explicit mode", () => {
    const input: StageBasketConfigurationInput = {
      stages: [
        { id: 1, position: 1, participantCount: 16 }, // group stage
        { id: 2, position: 2, participantCount: 4 },  // final
      ],
      playerIds: [],
      baskets: [
        { id: "g-in",  stageId: 1, type: "input",  ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: null },
        // Group stage output: advancingCount = null → qualifierCount = null (ambiguous).
        { id: "g-out", stageId: 1, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: null },
        { id: "f-in",  stageId: 2, type: "input",  ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: null },
        { id: "f-out", stageId: 2, type: "output", ordinal: 1, order: 1, colorId: null, participantIds: [], qualifierCount: null },
      ],
      routes: [{ id: "g-to-f", sourceBasketId: "g-out", targetBasketId: "f-in" }],
    };
    // Legacy mode must not break existing tournaments that have this state.
    assert.equal(validateStageBasketConfiguration(input).valid, true, "legacy mode");
    // Explicit mode must reject this as unusable for runtime basket transfer.
    const explicitProblems = explicitCodes(input);
    assert.ok(
      explicitProblems.includes("STAGE_OUTPUT_BASKET_QUALIFIER_COUNT_REQUIRED"),
      "explicit mode must flag group-stage null output — it cannot drive Phase 2 runtime",
    );
  });
});
