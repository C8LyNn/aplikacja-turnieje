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
      name: "four stages",
      mutate: () => ({
        initialParticipantCount: 16,
        stages: [1, 2, 3, 4].map((position) => ({
          key: `stage-${position}`,
          position,
          name: `Stage ${position}`,
          format: position === 4 ? "single_elimination" : "swiss",
          participantCount: 16 >> (position - 1),
          bestOf: 1,
          rounds: 1,
          ...(position < 4 ? { advancingCount: 16 >> position } : {}),
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
      name: "single elimination before the final stage",
      mutate: () => ({
        initialParticipantCount: 8,
        stages: [
          { ...singleStagePlan().stages[0], participantCount: 8 },
          {
            key: "rr",
            position: 2,
            name: "RR",
            format: "round_robin",
            participantCount: 4,
            bestOf: 3,
          },
        ],
      }),
      code: "SINGLE_ELIMINATION_NOT_FINAL",
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
        plan.stages[0].groupCount = 3;
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
      name: "unequal group configuration",
      mutate: () => {
        const plan = groupToEliminationPlan();
        plan.initialParticipantCount = 7;
        plan.stages[0].participantCount = 7;
        return plan;
      },
      code: "INVALID_GROUP_PARTICIPANT_COUNT",
    },
    {
      name: "too many group qualifiers",
      mutate: () => {
        const plan = groupToEliminationPlan();
        plan.stages[0].qualifiersPerGroup = 3;
        plan.stages[1].participantCount = 6;
        return plan;
      },
      code: "INVALID_GROUP_QUALIFIER_COUNT",
    },
    {
      name: "inconsistent group participant count",
      mutate: () => {
        const plan = groupToEliminationPlan();
        plan.initialParticipantCount = 10;
        plan.stages[0].participantCount = 10;
        return plan;
      },
      code: "INVALID_GROUP_PARTICIPANT_COUNT",
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
      mutate: (plan) => ({ ...plan, stages: [{ ...plan.stages[0], format: "double_elimination" }] }),
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
      name: "unsupported group seeding method",
      mutate: () => {
        const plan = groupToEliminationPlan();
        plan.stages[0].seedingMethod = "random";
        return plan;
      },
      code: "INVALID_GROUP_SEEDING_METHOD",
    },
  ];

  for (const testCase of invalidCases) {
    test(`rejects ${testCase.name}`, () => {
      const input = testCase.mutate(singleStagePlan());
      const codes = problemCodes(input);
      assert.ok(codes.includes(testCase.code), `Expected ${testCase.code}, received ${codes.join(", ")}`);
    });
  }

  test("reports unsupported group playoff transition with a stable code", () => {
    const plan = groupToEliminationPlan();
    plan.stages[0].qualifiersPerGroup = 3;
    plan.stages[1].participantCount = 6;
    assert.ok(problemCodes(plan).includes("UNSUPPORTED_GROUP_PLAYOFF_TRANSITION"));
  });

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
});
