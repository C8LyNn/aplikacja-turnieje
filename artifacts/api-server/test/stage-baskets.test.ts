import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  validateStageBasketConfiguration,
  type StageBasketConfigurationInput,
} from "../src/domain/tournament/stage-baskets";

function validConfiguration(): StageBasketConfigurationInput {
  return {
    stages: [
      { id: 11, position: 1 },
      { id: 22, position: 2 },
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
      },
      {
        id: "s1-out",
        stageId: 11,
        type: "output",
        ordinal: 1,
        order: 1,
        colorId: "blue",
        participantIds: [],
      },
      {
        id: "s2-in",
        stageId: 22,
        type: "input",
        ordinal: 1,
        order: 1,
        colorId: null,
        participantIds: [3, 4],
      },
      {
        id: "s2-out",
        stageId: 22,
        type: "output",
        ordinal: 1,
        order: 1,
        colorId: null,
        participantIds: [],
      },
    ],
    routes: [
      { id: "s1-to-s2", sourceBasketId: "s1-out", targetBasketId: "s2-in" },
    ],
  };
}

function codes(input: StageBasketConfigurationInput): string[] {
  return validateStageBasketConfiguration(input).problems.map(
    (problem) => problem.code,
  );
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
      },
      {
        id: `s1-out-${ordinal}`,
        stageId: 11,
        type: "output" as const,
        ordinal,
        order: ordinal,
        colorId: null,
        participantIds: [],
      },
      {
        id: `s2-in-${ordinal}`,
        stageId: 22,
        type: "input" as const,
        ordinal,
        order: ordinal,
        colorId: null,
        participantIds: [],
      },
      {
        id: `s2-out-${ordinal}`,
        stageId: 22,
        type: "output" as const,
        ordinal,
        order: ordinal,
        colorId: null,
        participantIds: [],
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
});
