import {
  calculateBalancedGroupSizes,
  calculateGroupAdvancingCount,
} from "./group-stage";

export const TOURNAMENT_STAGE_FORMATS = [
  "swiss",
  "round_robin",
  "group_stage",
  "single_elimination",
] as const;

export type TournamentStageFormat = (typeof TOURNAMENT_STAGE_FORMATS)[number];

export const STAGE_BEST_OF_VALUES = [1, 3, 5, 7] as const;
export type StageBestOf = (typeof STAGE_BEST_OF_VALUES)[number];

export const STAGE_RANKING_POLICIES = [
  "swiss_v1",
  "round_robin_v1",
  "group_v1",
  "elimination_bracket_v1",
] as const;

export type StageRankingPolicy = (typeof STAGE_RANKING_POLICIES)[number];

export type StageQualificationRule =
  | { type: "none" }
  | { type: "top_n"; advancingCount: number }
  | { type: "top_n_per_group"; qualifiersPerGroup: number };

export interface BaseTournamentStagePlan {
  key: string;
  position: number;
  name: string;
  format: TournamentStageFormat;
  participantCount: number;
  bestOf: StageBestOf;
}

export interface SwissTournamentStagePlan extends BaseTournamentStagePlan {
  format: "swiss";
  rounds: number;
  advancingCount?: number;
}

export interface RoundRobinTournamentStagePlan extends BaseTournamentStagePlan {
  format: "round_robin";
  advancingCount?: number;
}

export interface GroupTournamentStagePlan extends BaseTournamentStagePlan {
  format: "group_stage";
  groupCount: number;
  /** Derived largest group size; retained in the persisted V1-compatible shape. */
  participantsPerGroup: number;
  /** Maximum qualifiers taken from a group; smaller groups may qualify everyone. */
  qualifiersPerGroup: number;
  seedingMethod: "snake";
}

export interface SingleEliminationTournamentStagePlan extends BaseTournamentStagePlan {
  format: "single_elimination";
}

export type TournamentStagePlan =
  | SwissTournamentStagePlan
  | RoundRobinTournamentStagePlan
  | GroupTournamentStagePlan
  | SingleEliminationTournamentStagePlan;

export interface TournamentStagesPlan {
  initialParticipantCount: number;
  stages: TournamentStagePlan[];
}

export type TournamentStagePlanProblemCode =
  | "STAGE_COUNT_OUT_OF_RANGE"
  | "INVALID_INITIAL_PARTICIPANT_COUNT"
  | "INVALID_STAGE_KEY"
  | "DUPLICATE_STAGE_KEY"
  | "NON_CONTIGUOUS_STAGE_POSITION"
  | "EMPTY_STAGE_NAME"
  | "INVALID_STAGE_FORMAT"
  | "INVALID_BEST_OF"
  | "INVALID_PARTICIPANT_COUNT"
  | "PARTICIPANT_FLOW_MISMATCH"
  | "INVALID_ADVANCING_COUNT"
  | "SINGLE_ELIMINATION_NOT_FINAL"
  | "GROUP_STAGE_CANNOT_BE_FINAL"
  | "INVALID_SWISS_ROUNDS"
  | "INVALID_GROUP_COUNT"
  | "INVALID_GROUP_SIZE"
  | "INVALID_GROUP_SEEDING_METHOD"
  | "INVALID_GROUP_QUALIFIER_COUNT";

export interface TournamentStagePlanProblem {
  code: TournamentStagePlanProblemCode;
  path: string;
  message: string;
}

export type TournamentStagePlanValidationResult =
  | { valid: true; value: TournamentStagesPlan }
  | { valid: false; problems: TournamentStagePlanProblem[] };

type UnknownRecord = Record<string, unknown>;

interface IndexedStage {
  index: number;
  record: UnknownRecord;
}

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

function isStageFormat(value: unknown): value is TournamentStageFormat {
  return typeof value === "string" && TOURNAMENT_STAGE_FORMATS.includes(value as TournamentStageFormat);
}

function addProblem(
  problems: TournamentStagePlanProblem[],
  code: TournamentStagePlanProblemCode,
  path: string,
  message: string,
): void {
  problems.push({ code, path, message });
}

function validatePositions(
  stages: readonly IndexedStage[],
  problems: TournamentStagePlanProblem[],
): boolean {
  let allInteger = true;
  for (const stage of stages) {
    if (!isPositiveInteger(stage.record.position)) {
      addProblem(
        problems,
        "NON_CONTIGUOUS_STAGE_POSITION",
        `stages[${stage.index}].position`,
        "Stage position must be a positive integer.",
      );
      allInteger = false;
    }
  }
  if (!allInteger) return false;

  const positions = stages.map((stage) => stage.record.position as number).sort((a, b) => a - b);
  const contiguous = positions.every((position, index) => position === index + 1);
  if (!contiguous) {
    addProblem(
      problems,
      "NON_CONTIGUOUS_STAGE_POSITION",
      "stages",
      "Stage positions must be unique and contiguous from 1.",
    );
  }
  return contiguous;
}

function validateCommonStageFields(
  stages: readonly IndexedStage[],
  problems: TournamentStagePlanProblem[],
): void {
  const firstIndexByKey = new Map<string, number>();

  for (const stage of stages) {
    const { index, record } = stage;
    const path = `stages[${index}]`;

    if (typeof record.name !== "string" || record.name.trim().length === 0) {
      addProblem(problems, "EMPTY_STAGE_NAME", `${path}.name`, "Stage name cannot be empty.");
    }

    if (typeof record.key !== "string" || record.key.trim().length === 0) {
      addProblem(
        problems,
        "INVALID_STAGE_KEY",
        `${path}.key`,
        "Stage key must be a non-empty string.",
      );
    } else {
      const firstIndex = firstIndexByKey.get(record.key);
      if (firstIndex != null) {
        addProblem(
          problems,
          "DUPLICATE_STAGE_KEY",
          `${path}.key`,
          `Stage key duplicates stages[${firstIndex}].key.`,
        );
      } else {
        firstIndexByKey.set(record.key, index);
      }
    }

    if (!isStageFormat(record.format)) {
      addProblem(
        problems,
        "INVALID_STAGE_FORMAT",
        `${path}.format`,
        "Stage format must be swiss, round_robin, group_stage or single_elimination.",
      );
    }

    if (
      !isPositiveInteger(record.bestOf) ||
      !STAGE_BEST_OF_VALUES.includes(record.bestOf as StageBestOf)
    ) {
      addProblem(
        problems,
        "INVALID_BEST_OF",
        `${path}.bestOf`,
        "bestOf must equal 1, 3, 5 or 7.",
      );
    }

    if (!isPositiveInteger(record.participantCount)) {
      addProblem(
        problems,
        "INVALID_PARTICIPANT_COUNT",
        `${path}.participantCount`,
        "participantCount must be a positive integer.",
      );
    }
  }
}

function validateFormatConfiguration(
  stages: readonly IndexedStage[],
  problems: TournamentStagePlanProblem[],
): void {
  for (const stage of stages) {
    const { index, record } = stage;
    const path = `stages[${index}]`;

    if (record.format === "swiss" && !isPositiveInteger(record.rounds)) {
      addProblem(
        problems,
        "INVALID_SWISS_ROUNDS",
        `${path}.rounds`,
        "Swiss rounds must be a positive integer.",
      );
    }

    if (record.format === "group_stage") {
      const participantCount = isPositiveInteger(record.participantCount)
        ? record.participantCount
        : null;
      const groupCount = isPositiveInteger(record.groupCount)
        ? record.groupCount
        : null;

      if (
        groupCount == null ||
        participantCount == null ||
        groupCount > Math.floor(participantCount / 2)
      ) {
        addProblem(
          problems,
          "INVALID_GROUP_COUNT",
          `${path}.groupCount`,
          "groupCount must be an integer from 1 to floor(participantCount / 2).",
        );
      }

      let largestGroupSize: number | null = null;
      if (participantCount != null && groupCount != null && groupCount <= Math.floor(participantCount / 2)) {
        largestGroupSize = Math.max(...calculateBalancedGroupSizes(participantCount, groupCount));
        if (
          record.participantsPerGroup !== undefined &&
          record.participantsPerGroup !== largestGroupSize
        ) {
          addProblem(
            problems,
            "INVALID_GROUP_SIZE",
            `${path}.participantsPerGroup`,
            "participantsPerGroup is derived and must equal ceil(participantCount / groupCount).",
          );
        }
      }

      if (
        !isPositiveInteger(record.qualifiersPerGroup) ||
        (largestGroupSize != null && record.qualifiersPerGroup > largestGroupSize)
      ) {
        addProblem(
          problems,
          "INVALID_GROUP_QUALIFIER_COUNT",
          `${path}.qualifiersPerGroup`,
          "qualifiersPerGroup must be an integer from 1 to the largest group size.",
        );
      }

      if (record.seedingMethod !== "snake") {
        addProblem(
          problems,
          "INVALID_GROUP_SEEDING_METHOD",
          `${path}.seedingMethod`,
          "group_stage seedingMethod must equal snake.",
        );
      }
    }
  }
}

function validateParticipantFlow(
  stages: readonly IndexedStage[],
  initialParticipantCount: unknown,
  positionsValid: boolean,
  problems: TournamentStagePlanProblem[],
): void {
  if (!positionsValid || stages.length === 0) return;

  const ordered = [...stages].sort(
    (left, right) => (left.record.position as number) - (right.record.position as number),
  );
  const first = ordered[0];
  if (
    isPositiveInteger(initialParticipantCount) &&
    isPositiveInteger(first.record.participantCount) &&
    first.record.participantCount !== initialParticipantCount
  ) {
    addProblem(
      problems,
      "PARTICIPANT_FLOW_MISMATCH",
      `stages[${first.index}].participantCount`,
      "The first stage participantCount must equal initialParticipantCount.",
    );
  }

  ordered.forEach((stage, orderedIndex) => {
    const { index, record } = stage;
    const path = `stages[${index}]`;
    const isFinal = orderedIndex === ordered.length - 1;

    if (record.format === "single_elimination" && !isFinal) {
      addProblem(
        problems,
        "SINGLE_ELIMINATION_NOT_FINAL",
        `${path}.format`,
        "single_elimination may only be the final stage.",
      );
      return;
    }

    if (isFinal) {
      if (record.format === "group_stage") {
        addProblem(
          problems,
          "GROUP_STAGE_CANNOT_BE_FINAL",
          `${path}.format`,
          "group_stage must qualify participants to a following stage.",
        );
      }
      if (record.advancingCount !== undefined) {
        addProblem(
          problems,
          "INVALID_ADVANCING_COUNT",
          `${path}.advancingCount`,
          "The final stage cannot qualify participants to another stage.",
        );
      }
      return;
    }

    const next = ordered[orderedIndex + 1];
    let advancingCount: number | null = null;

    if (record.format === "swiss" || record.format === "round_robin") {
      if (
        !Number.isInteger(record.advancingCount) ||
        (record.advancingCount as number) < 2 ||
        (isPositiveInteger(record.participantCount) &&
          (record.advancingCount as number) > record.participantCount)
      ) {
        addProblem(
          problems,
          "INVALID_ADVANCING_COUNT",
          `${path}.advancingCount`,
          "A non-final stage must advance at least 2 and no more than participantCount.",
        );
      } else {
        advancingCount = record.advancingCount as number;
      }
    } else if (record.format === "group_stage") {
      if (
        isPositiveInteger(record.participantCount) &&
        isPositiveInteger(record.groupCount) &&
        record.groupCount <= Math.floor(record.participantCount / 2) &&
        isPositiveInteger(record.qualifiersPerGroup)
      ) {
        try {
          advancingCount = calculateGroupAdvancingCount(
            record.participantCount,
            record.groupCount,
            record.qualifiersPerGroup,
          );
          if (advancingCount < 2) {
            addProblem(
              problems,
              "INVALID_ADVANCING_COUNT",
              `${path}.qualifiersPerGroup`,
              "A non-final group stage must advance at least 2 participants in total.",
            );
            advancingCount = null;
          }
        } catch {
          advancingCount = null;
        }
      }
    }

    if (
      advancingCount != null &&
      isPositiveInteger(next.record.participantCount) &&
      next.record.participantCount !== advancingCount
    ) {
      addProblem(
        problems,
        "PARTICIPANT_FLOW_MISMATCH",
        `stages[${next.index}].participantCount`,
        `participantCount must equal ${advancingCount}, the number advancing from the previous stage.`,
      );
    }
  });
}

function buildStage(record: UnknownRecord): TournamentStagePlan {
  const format = record.format as TournamentStageFormat;
  const common = {
    key: record.key as string,
    position: record.position as number,
    name: record.name as string,
    participantCount: record.participantCount as number,
    bestOf: record.bestOf as StageBestOf,
  };

  switch (format) {
    case "swiss":
      return {
        ...common,
        format: "swiss",
        rounds: record.rounds as number,
        ...(record.advancingCount === undefined
          ? {}
          : { advancingCount: record.advancingCount as number }),
      };
    case "round_robin":
      return {
        ...common,
        format: "round_robin",
        ...(record.advancingCount === undefined
          ? {}
          : { advancingCount: record.advancingCount as number }),
      };
    case "group_stage": {
      const groupCount = record.groupCount as number;
      const participantsPerGroup = Math.max(
        ...calculateBalancedGroupSizes(common.participantCount, groupCount),
      );
      return {
        ...common,
        format: "group_stage",
        groupCount,
        participantsPerGroup,
        qualifiersPerGroup: record.qualifiersPerGroup as number,
        seedingMethod: "snake",
      };
    }
    case "single_elimination":
      return { ...common, format: "single_elimination" };
  }
}

export function validateTournamentStagePlan(input: unknown): TournamentStagePlanValidationResult {
  const problems: TournamentStagePlanProblem[] = [];
  const plan = asRecord(input) ?? {};
  const rawStages = Array.isArray(plan.stages) ? plan.stages : [];
  const stages = rawStages.map<IndexedStage>((stage, index) => ({
    index,
    record: asRecord(stage) ?? {},
  }));

  if (rawStages.length < 1 || rawStages.length > 3) {
    addProblem(
      problems,
      "STAGE_COUNT_OUT_OF_RANGE",
      "stages",
      "A tournament must contain from 1 to 3 stages.",
    );
  }
  if (!Number.isInteger(plan.initialParticipantCount) || (plan.initialParticipantCount as number) < 2) {
    addProblem(
      problems,
      "INVALID_INITIAL_PARTICIPANT_COUNT",
      "initialParticipantCount",
      "initialParticipantCount must be an integer of at least 2.",
    );
  }

  const positionsValid = validatePositions(stages, problems);
  validateCommonStageFields(stages, problems);
  validateFormatConfiguration(stages, problems);
  validateParticipantFlow(stages, plan.initialParticipantCount, positionsValid, problems);

  if (problems.length > 0) return { valid: false, problems };

  const value: TournamentStagesPlan = {
    initialParticipantCount: plan.initialParticipantCount as number,
    stages: stages
      .map((stage) => buildStage(stage.record))
      .sort((left, right) => left.position - right.position),
  };
  return { valid: true, value };
}
