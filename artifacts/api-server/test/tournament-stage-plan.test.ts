import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  validateTournamentStagePlan,
  type TournamentStagePlanProblemCode,
} from "../src/domain/tournament/tournament-stage-plan";

const singleStagePlan = () => ({
  initialParticipantCount: 8,
  stages: [
    {
      key: "playoff",
      position: 1,
      name: "Play-off",
      format: "single_elimination",
      participantCount: 8,
      bestOf: 3,
    },
  ],
});

const swissToEliminationPlan = () => ({
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

const groupToEliminationPlan = () => ({
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

const threeStagePlan = () => ({
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
      key: "groups",
      position: 2,
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
      position: 3,
      name: "Play-off",
      format: "single_elimination",
      participantCount: 4,
      bestOf: 5,
    },
  ],
});

const problemCodes = (input: unknown): TournamentStagePlanProblemCode[] => {
  const result = validateTournamentStagePlan(input);
  assert.equal(result.valid, false);
  return result.valid ? [] : result.problems.map((problem) => problem.code);
};

describe("validateTournamentStagePlan valid plans", () => {
  const validCases = [
    ["single-stage tournament", singleStagePlan],
    ["Swiss BO1 to Single Elimination BO3", swissToEliminationPlan],
    ["Group stage BO3 to Single Elimination BO5", groupToEliminationPlan],
    ["Swiss to Group stage to Single Elimination", threeStagePlan],
  ] as const;

  for (const [name, createPlan] of validCases) {
    test(`accepts ${name}`, () => {
      const input = createPlan();
      const snapshot = structuredClone(input);
      const result = validateTournamentStagePlan(input);
      assert.equal(result.valid, true);
      assert.deepEqual(input, snapshot);
      if (!result.valid) return;
      assert.equal(result.value.stages.length, input.stages.length);
    });
  }

  test("normalizes valid stages by position without mutating input", () => {
    const input = swissToEliminationPlan();
    input.stages.reverse();
    const snapshot = structuredClone(input);
    const result = validateTournamentStagePlan(input);
    assert.equal(result.valid, true);
    assert.deepEqual(input, snapshot);
    if (!result.valid) return;
    assert.deepEqual(result.value.stages.map((stage) => stage.key), ["swiss", "playoff"]);
  });

  test("allows all Round Robin participants to advance as permitted by the ADR", () => {
    const input = {
      initialParticipantCount: 4,
      stages: [
        {
          key: "round-robin",
          position: 1,
          name: "Round Robin",
          format: "round_robin",
          participantCount: 4,
          bestOf: 3,
          advancingCount: 4,
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
    };

    assert.equal(validateTournamentStagePlan(input).valid, true);
  });

  test("accepts uneven balanced groups and lets everyone advance", () => {
    const input = {
      initialParticipantCount: 17,
      stages: [
        {
          key: "groups",
          position: 1,
          name: "Groups",
          format: "group_stage",
          participantCount: 17,
          bestOf: 1,
          groupCount: 4,
          participantsPerGroup: 5,
          qualifiersPerGroup: 5,
          seedingMethod: "snake",
        },
        {
          key: "playoff",
          position: 2,
          name: "Play-off",
          format: "single_elimination",
          participantCount: 17,
          bestOf: 3,
        },
      ],
    };

    const result = validateTournamentStagePlan(input);
    assert.equal(result.valid, true);
    if (!result.valid) return;
    const groupStage = result.value.stages[0];
    assert.equal(groupStage.format, "group_stage");
    if (groupStage.format !== "group_stage") return;
    assert.equal(groupStage.participantsPerGroup, 5);
    assert.equal(result.value.stages[1].participantCount, 17);
  });

  test("accepts an arbitrary valid group count", () => {
    const input = groupToEliminationPlan();
    input.stages[0].groupCount = 3;
    input.stages[0].participantsPerGroup = 3;
    input.stages[0].qualifiersPerGroup = 3;
    input.stages[1].participantCount = 8;
    assert.equal(validateTournamentStagePlan(input).valid, true);
  });
});

describe("validateTournamentStagePlan invalid plans", () => {
  const invalidCases: ReadonlyArray<{
    name: string;
    mutate: (plan: any) => unknown;
    code: TournamentStagePlanProblemCode;
  }> = [
    {
      name: "zero stages",
      mutate: (plan) => ({ ...plan, stages: [] }),
      code: "STAGE_COUNT_OUT_OF_RANGE",
    },
    {
      name: "eleven stages",
      mutate: () => ({
        initialParticipantCount: 2,
        stages: Array.from({ length: 11 }, (_, index) => index + 1).map((position) => ({
          key: `stage-${position}`,
          position,
          name: `Stage ${position}`,
          format: position === 11 ? "single_elimination" : "round_robin",
          participantCount: 2,
          bestOf: 1,
          ...(position < 11 ? { advancingCount: 2 } : {}),
        })),
      }),
      code: "STAGE_COUNT_OUT_OF_RANGE",
    },
    {
      name: "invalid initial participant count",
      mutate: (plan) => ({ ...plan, initialParticipantCount: 1 }),
      code: "INVALID_INITIAL_PARTICIPANT_COUNT",
    },
    {
      name: "even bestOf",
      mutate: (plan) => ({ ...plan, stages: [{ ...plan.stages[0], bestOf: 2 }] }),
      code: "INVALID_BEST_OF",
    },
    {
      name: "unsupported odd bestOf",
      mutate: (plan) => ({ ...plan, stages: [{ ...plan.stages[0], bestOf: 9 }] }),
      code: "INVALID_BEST_OF",
    },
    {
      name: "participant flow mismatch",
      mutate: () => {
        const plan = swissToEliminationPlan();
        plan.stages[1].participantCount = 4;
        return plan;
      },
      code: "PARTICIPANT_FLOW_MISMATCH",
    },
    {
      name: "single elimination with a non-round boundary qualifier count",
      mutate: () => ({
        initialParticipantCount: 16,
        stages: [
          { ...singleStagePlan().stages[0], participantCount: 16, advancingCount: 7 },
          {
            key: "rr",
            position: 2,
            name: "RR",
            format: "round_robin",
            participantCount: 7,
            bestOf: 3,
          },
        ],
      }),
      code: "INVALID_ELIMINATION_ADVANCING_COUNT",
    },
    {
      name: "group stage as the final stage",
      mutate: () => {
        const plan = groupToEliminationPlan();
        plan.stages = [plan.stages[0]];
        return plan;
      },
      code: "GROUP_STAGE_CANNOT_BE_FINAL",
    },
    {
      name: "empty stage name",
      mutate: (plan) => ({ ...plan, stages: [{ ...plan.stages[0], name: "  " }] }),
      code: "EMPTY_STAGE_NAME",
    },
    {
      name: "duplicate stage key",
      mutate: () => {
        const plan = swissToEliminationPlan();
        plan.stages[1].key = plan.stages[0].key;
        return plan;
      },
      code: "DUPLICATE_STAGE_KEY",
    },
    {
      name: "non-contiguous positions",
      mutate: () => {
        const plan = swissToEliminationPlan();
        plan.stages[1].position = 3;
        return plan;
      },
      code: "NON_CONTIGUOUS_STAGE_POSITION",
    },
    {
      name: "invalid group count",
      mutate: () => {
        const plan = groupToEliminationPlan();
        plan.stages[0].groupCount = 5;
        return plan;
      },
      code: "INVALID_GROUP_COUNT",
    },
    {
      name: "invalid group size",
      mutate: () => {
        const plan = groupToEliminationPlan();
        plan.stages[0].participantsPerGroup = 2;
        return plan;
      },
      code: "INVALID_GROUP_SIZE",
    },
    {
      name: "too many group qualifiers",
      mutate: () => {
        const plan = groupToEliminationPlan();
        plan.stages[0].qualifiersPerGroup = 5;
        plan.stages[1].participantCount = 8;
        return plan;
      },
      code: "INVALID_GROUP_QUALIFIER_COUNT",
    },
    {
      name: "invalid Swiss rounds",
      mutate: () => {
        const plan = swissToEliminationPlan();
        plan.stages[0].rounds = 0;
        return plan;
      },
      code: "INVALID_SWISS_ROUNDS",
    },
    {
      name: "invalid advancing count",
      mutate: () => {
        const plan = swissToEliminationPlan();
        plan.stages[0].advancingCount = 1;
        plan.stages[1].participantCount = 1;
        return plan;
      },
      code: "INVALID_ADVANCING_COUNT",
    },
    {
      name: "advancement on the final stage",
      mutate: (plan) => ({
        ...plan,
        stages: [{ ...plan.stages[0], advancingCount: 2 }],
      }),
      code: "INVALID_ADVANCING_COUNT",
    },
    {
      name: "unsupported stage format",
      mutate: (plan) => ({ ...plan, stages: [{ ...plan.stages[0], format: "unsupported_format" as any }] }),
      code: "INVALID_STAGE_FORMAT",
    },
    {
      name: "incomplete Swiss configuration",
      mutate: () => {
        const plan = swissToEliminationPlan();
        delete (plan.stages[0] as any).rounds;
        return plan;
      },
      code: "INVALID_SWISS_ROUNDS",
    },
    {
      name: "unsupported group placement method",
      mutate: () => {
        const plan = groupToEliminationPlan();
        plan.stages[0].seedingMethod = "unsupported";
        return plan;
      },
      code: "INVALID_GROUP_PLACEMENT_METHOD",
    },
  ];

  for (const testCase of invalidCases) {
    test(`rejects ${testCase.name}`, () => {
      const input = testCase.mutate(singleStagePlan());
      const codes = problemCodes(input);
      assert.ok(codes.includes(testCase.code), `Expected ${testCase.code}, received ${codes.join(", ")}`);
    });
  }


  test("returns an ordered problem list with code, path and message", () => {
    const input = { initialParticipantCount: 1, stages: [] };
    const first = validateTournamentStagePlan(input);
    const second = validateTournamentStagePlan(input);
    assert.equal(first.valid, false);
    assert.deepEqual(first, second);
    if (first.valid) return;
    assert.deepEqual(first.problems.map((problem) => problem.code), [
      "STAGE_COUNT_OUT_OF_RANGE",
      "INVALID_INITIAL_PARTICIPANT_COUNT",
    ]);
    for (const problem of first.problems) {
      assert.ok(problem.path.length > 0);
      assert.ok(problem.message.length > 0);
    }
  });


  test("rejects a non-final group stage that advances only one participant in total", () => {
    const result = validateTournamentStagePlan({
      initialParticipantCount: 4,
      stages: [
        {
          key: "groups", position: 1, name: "Groups", format: "group_stage",
          participantCount: 4, bestOf: 1, groupCount: 1,
          participantsPerGroup: 4, qualifiersPerGroup: 1, seedingMethod: "snake",
        },
        {
          key: "playoff", position: 2, name: "Playoff", format: "single_elimination",
          participantCount: 1, bestOf: 1,
        },
      ],
    });
    assert.equal(result.valid, false);
    if (!result.valid) {
      assert.ok(result.problems.some((problem) => problem.code === "INVALID_ADVANCING_COUNT"));
    }
  });

  test("accepts groups 32 to 16 and rejects every mismatched downstream capacity", () => {
    const create = (nextCount: number) => ({
      initialParticipantCount: 32,
      stages: [
        {
          key: "groups", position: 1, name: "Groups", format: "group_stage",
          participantCount: 32, bestOf: 1, groupCount: 8,
          participantsPerGroup: 4, qualifiersPerGroup: 2, seedingMethod: "snake",
        },
        {
          key: "playoff", position: 2, name: "Playoff", format: "single_elimination",
          participantCount: nextCount, bestOf: 3,
        },
      ],
    });
    assert.equal(validateTournamentStagePlan(create(16)).valid, true);
    for (const count of [15, 17, 19, 21]) {
      assert.ok(problemCodes(create(count)).includes("PARTICIPANT_FLOW_MISMATCH"));
    }
  });

  test("supports qualifying elimination rounds and rejects arbitrary cut lines", () => {
    const create = (participantCount: number, advancingCount: number) => ({
      initialParticipantCount: participantCount,
      stages: [
        {
          key: "qualifier", position: 1, name: "Qualifier", format: "single_elimination",
          participantCount, bestOf: 1, advancingCount,
        },
        {
          key: "final", position: 2, name: "Final", format: "single_elimination",
          participantCount: advancingCount, bestOf: 3,
        },
      ],
    });
    for (const count of [8, 4, 2, 1]) assert.equal(validateTournamentStagePlan(create(16, count)).valid, true);
    for (const count of [16, 8, 4, 2, 1]) assert.equal(validateTournamentStagePlan(create(17, count)).valid, true);
    for (const count of [7, 10]) assert.ok(problemCodes(create(16, count)).includes("INVALID_ELIMINATION_ADVANCING_COUNT"));
  });

  test("accepts three consecutive stages with an intermediate elimination qualifier", () => {
    const result = validateTournamentStagePlan({
      initialParticipantCount: 32,
      stages: [
        {
          key: "groups", position: 1, name: "Groups", format: "group_stage",
          participantCount: 32, bestOf: 1, groupCount: 8,
          participantsPerGroup: 4, qualifiersPerGroup: 2, seedingMethod: "snake",
        },
        {
          key: "qualifier", position: 2, name: "Qualifier", format: "single_elimination",
          participantCount: 16, bestOf: 3, advancingCount: 8,
        },
        {
          key: "final", position: 3, name: "Final", format: "single_elimination",
          participantCount: 8, bestOf: 5,
        },
      ],
    });
    assert.equal(result.valid, true);
  });
});


describe("configurable seeding and placement", () => {
  test("accepts deterministic random entry seeding and group placement", () => {
    const plan = groupToEliminationPlan();
    Object.assign(plan.stages[0], {
      entrySeedingMethod: "random",
      placementMethod: "random",
      resultSeedingMethod: "global_ranking",
      randomSeed: "draw-2026",
      randomRevealOrder: "sequential",
      seedingMethod: "random",
    });
    Object.assign(plan.stages[1], { placementMethod: "standard" });
    const result = validateTournamentStagePlan(plan);
    assert.equal(result.valid, true);
    if (!result.valid) return;
    const groups = result.value.stages[0];
    assert.equal(groups.entrySeedingMethod, "random");
    assert.equal(groups.randomRevealOrder, "sequential");
    if (groups.format !== "group_stage") return;
    assert.equal(groups.placementMethod, "random");
    assert.equal(groups.resultSeedingMethod, "global_ranking");
  });

  test("rejects random configuration without a deterministic key", () => {
    const plan = singleStagePlan();
    Object.assign(plan.stages[0], {
      entrySeedingMethod: "random",
      placementMethod: "standard",
    });
    assert.ok(problemCodes(plan).includes("RANDOM_SEED_REQUIRED"));
  });

  test("keeps Patch 02 defaults for old plans", () => {
    const result = validateTournamentStagePlan(groupToEliminationPlan());
    assert.equal(result.valid, true);
    if (!result.valid) return;
    const groups = result.value.stages[0];
    assert.equal(groups.entrySeedingMethod, "preserve");
    assert.equal(groups.randomRevealOrder, "instant");
    if (groups.format !== "group_stage") return;
    assert.equal(groups.placementMethod, "snake");
    assert.equal(groups.resultSeedingMethod, "rank_bands");
  });
});
