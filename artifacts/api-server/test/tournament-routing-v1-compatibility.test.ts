import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  compileV1StagePlanToRoutingV2,
  serializeCompiledTournamentRoutingPlanV2,
} from "../src/domain/tournament/v2/index";

const oneStage = () => ({
  initialParticipantCount: 8,
  stages: [
    {
      key: "playoff",
      position: 1,
      name: "Play-off",
      format: "single_elimination" as const,
      participantCount: 8,
      bestOf: 3 as const,
    },
  ],
});

const threeStages = () => ({
  initialParticipantCount: 16,
  stages: [
    {
      key: "swiss",
      position: 1,
      name: "Swiss",
      format: "swiss" as const,
      participantCount: 16,
      bestOf: 1 as const,
      rounds: 5,
      advancingCount: 8,
    },
    {
      key: "groups",
      position: 2,
      name: "Groups",
      format: "group_stage" as const,
      participantCount: 8,
      bestOf: 3 as const,
      groupCount: 2,
      participantsPerGroup: 4,
      qualifiersPerGroup: 2,
      seedingMethod: "snake" as const,
    },
    {
      key: "playoff",
      position: 3,
      name: "Play-off",
      format: "single_elimination" as const,
      participantCount: 4,
      bestOf: 5 as const,
    },
  ],
});

describe("v1 stage plan compilation compatibility", () => {
  test("compiles a single stage without generating runtime matches", () => {
    const result = compileV1StagePlanToRoutingV2(oneStage());
    assert.equal(result.valid, true);
    if (!result.valid) return;
    assert.equal(result.value.stages.length, 1);
    assert.equal(result.value.entryPoints.length, 1);
    assert.equal(result.value.routes.length, 1);
    assert.equal(result.value.routes[0].source.type, "registration_bucket");
    assert.equal(result.value.logicalMatches.length, 0);
  });

  test("preserves Swiss top_n flow into single elimination", () => {
    const result = compileV1StagePlanToRoutingV2({
      initialParticipantCount: 16,
      stages: [
        {
          key: "swiss",
          position: 1,
          name: "Swiss",
          format: "swiss",
          participantCount: 16,
          bestOf: 1,
          rounds: 5,
          advancingCount: 8,
        },
        {
          key: "playoff",
          position: 2,
          name: "Play-off",
          format: "single_elimination",
          participantCount: 8,
          bestOf: 3,
        },
      ],
    });
    assert.equal(result.valid, true);
    if (!result.valid) return;
    const selection = result.value.routes.find(
      (route) => route.source.type === "stage_result",
    )?.source;
    assert.ok(selection?.type === "stage_result");
    assert.deepEqual(selection.selection, {
      type: "top_n",
      count: 8,
      exactCardinality: 8,
    });
  });

  test("preserves group top_n_per_group flow into single elimination", () => {
    const result = compileV1StagePlanToRoutingV2({
      initialParticipantCount: 8,
      stages: [
        {
          key: "groups",
          position: 1,
          name: "Groups",
          format: "group_stage",
          participantCount: 8,
          bestOf: 3,
          groupCount: 2,
          participantsPerGroup: 4,
          qualifiersPerGroup: 2,
          seedingMethod: "snake",
        },
        {
          key: "playoff",
          position: 2,
          name: "Play-off",
          format: "single_elimination",
          participantCount: 4,
          bestOf: 5,
        },
      ],
    });
    assert.equal(result.valid, true);
    if (!result.valid) return;
    const source = result.value.routes.find(
      (route) => route.source.type === "stage_result",
    )?.source;
    assert.ok(source?.type === "stage_result");
    assert.deepEqual(source.selection, {
      type: "top_n_per_group",
      countPerGroup: 2,
      groupCount: 2,
      exactGroupSizes: [4, 4],
      exactCardinality: 4,
    });
  });

  test("compiles three stages deterministically with exact participant flow", () => {
    const first = compileV1StagePlanToRoutingV2(threeStages());
    const second = compileV1StagePlanToRoutingV2(threeStages());
    assert.equal(first.valid, true);
    assert.equal(second.valid, true);
    if (!first.valid || !second.valid) return;
    assert.equal(first.value.stages.length, 3);
    assert.equal(first.value.routes.length, 3);
    assert.deepEqual(
      first.value.stages.map((stage) => stage.exactParticipantCapacity),
      [16, 8, 4],
    );
    assert.equal(
      serializeCompiledTournamentRoutingPlanV2(first.value),
      serializeCompiledTournamentRoutingPlanV2(second.value),
    );
  });

  test("rejects an invalid v1 participant flow before compilation", () => {
    const invalid = threeStages();
    invalid.stages[1].participantCount = 7;
    const result = compileV1StagePlanToRoutingV2(invalid);
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.source, "v1");
  });
});
