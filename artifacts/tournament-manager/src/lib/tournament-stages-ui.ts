import type {
  Match,
  TournamentInput,
  TournamentStagePlanInput,
  TournamentStagePlanItemInput,
} from "@workspace/api-client-react";

export type StageFormat = TournamentStagePlanItemInput["format"];

export interface StageDraft {
  clientId: string;
  name: string;
  format: StageFormat;
  participantCount: number;
  bestOf: 1 | 3 | 5 | 7;
  rounds?: number;
  advancingCount?: number;
  groupCount?: 2 | 4;
  participantsPerGroup?: number;
  qualifiersPerGroup?: 1 | 2;
}

export interface StagePlanValidationError {
  stageIndex?: number;
  field?: keyof StageDraft;
  message: string;
}

export const STAGE_FORMAT_LABELS: Record<StageFormat, string> = {
  swiss: "System szwajcarski",
  round_robin: "Każdy z każdym",
  group_stage: "Faza grupowa",
  single_elimination: "Drabinka eliminacyjna",
};

export const STAGE_STATUS_LABELS = {
  planned: "Planowany",
  active: "Aktywny",
  completed: "Ukończony",
} as const;

export function createStageDraft(
  position: number,
  format: StageFormat = "swiss",
): StageDraft {
  return {
    clientId:
      globalThis.crypto?.randomUUID?.() ?? `stage-${Date.now()}-${position}`,
    name: `Etap ${position}`,
    format,
    participantCount: format === "group_stage" ? 8 : 8,
    bestOf: 1,
    rounds: format === "swiss" ? 3 : undefined,
    advancingCount: 4,
    groupCount: format === "group_stage" ? 2 : undefined,
    participantsPerGroup: format === "group_stage" ? 4 : undefined,
    qualifiersPerGroup: format === "group_stage" ? 2 : undefined,
  };
}

export function normalizeStageDrafts(stages: StageDraft[]): StageDraft[] {
  return stages.map((stage, index) => ({
    ...stage,
    name: /^Etap \d+$/.test(stage.name) ? `Etap ${index + 1}` : stage.name,
  }));
}

export function validateStageDrafts(
  stages: StageDraft[],
): StagePlanValidationError[] {
  const errors: StagePlanValidationError[] = [];
  if (stages.length < 1 || stages.length > 3) {
    errors.push({ message: "Plan musi zawierać od 1 do 3 etapów." });
    return errors;
  }

  stages.forEach((stage, index) => {
    const isLast = index === stages.length - 1;
    if (!stage.name.trim()) {
      errors.push({
        stageIndex: index,
        field: "name",
        message: `Etap ${index + 1} wymaga nazwy.`,
      });
    }
    if (
      !Number.isInteger(stage.participantCount) ||
      stage.participantCount < 2
    ) {
      errors.push({
        stageIndex: index,
        field: "participantCount",
        message: `Etap ${index + 1} wymaga co najmniej 2 uczestników.`,
      });
    }
    if (![1, 3, 5, 7].includes(stage.bestOf)) {
      errors.push({
        stageIndex: index,
        field: "bestOf",
        message: `Etap ${index + 1} ma niepoprawne BO.`,
      });
    }
    if (
      stage.format === "swiss" &&
      (!Number.isInteger(stage.rounds) || (stage.rounds ?? 0) < 1)
    ) {
      errors.push({
        stageIndex: index,
        field: "rounds",
        message: `Etap ${index + 1} wymaga liczby rund Swiss.`,
      });
    }
    if (stage.format === "single_elimination" && !isLast) {
      errors.push({
        stageIndex: index,
        field: "format",
        message: "Single Elimination może być wyłącznie ostatnim etapem.",
      });
    }
    if (stage.format === "group_stage") {
      if (isLast) {
        errors.push({
          stageIndex: index,
          field: "format",
          message: "Faza grupowa wymaga kolejnego etapu.",
        });
      }
      if (stage.groupCount !== 2 && stage.groupCount !== 4) {
        errors.push({
          stageIndex: index,
          field: "groupCount",
          message: "Faza grupowa wymaga 2 albo 4 grup.",
        });
      }
      if (
        !Number.isInteger(stage.participantsPerGroup) ||
        (stage.participantsPerGroup ?? 0) < 3 ||
        (stage.participantsPerGroup ?? 0) > 8
      ) {
        errors.push({
          stageIndex: index,
          field: "participantsPerGroup",
          message: "Grupa musi mieć od 3 do 8 uczestników.",
        });
      }
      if (stage.qualifiersPerGroup !== 1 && stage.qualifiersPerGroup !== 2) {
        errors.push({
          stageIndex: index,
          field: "qualifiersPerGroup",
          message: "Z grupy może awansować 1 albo 2 uczestników.",
        });
      }
      if (
        (stage.qualifiersPerGroup ?? 0) >= (stage.participantsPerGroup ?? 0)
      ) {
        errors.push({
          stageIndex: index,
          field: "qualifiersPerGroup",
          message:
            "Liczba kwalifikantów musi być mniejsza od liczby osób w grupie.",
        });
      }
      const expected =
        (stage.groupCount ?? 0) * (stage.participantsPerGroup ?? 0);
      if (stage.participantCount !== expected) {
        errors.push({
          stageIndex: index,
          field: "participantCount",
          message: `Faza grupowa wymaga dokładnie ${expected} uczestników.`,
        });
      }
    }
    if (
      !isLast &&
      stage.format !== "group_stage" &&
      stage.format !== "single_elimination"
    ) {
      if (
        !Number.isInteger(stage.advancingCount) ||
        (stage.advancingCount ?? 0) < 2
      ) {
        errors.push({
          stageIndex: index,
          field: "advancingCount",
          message: `Etap ${index + 1} wymaga co najmniej 2 kwalifikantów.`,
        });
      }
      if ((stage.advancingCount ?? 0) > stage.participantCount) {
        errors.push({
          stageIndex: index,
          field: "advancingCount",
          message: "Nie może awansować więcej osób niż gra w etapie.",
        });
      }
    }
  });

  for (let index = 0; index < stages.length - 1; index += 1) {
    const stage = stages[index];
    const next = stages[index + 1];
    const advancing =
      stage.format === "group_stage"
        ? (stage.groupCount ?? 0) * (stage.qualifiersPerGroup ?? 0)
        : (stage.advancingCount ?? 0);
    if (advancing !== next.participantCount) {
      errors.push({
        stageIndex: index,
        field:
          stage.format === "group_stage"
            ? "qualifiersPerGroup"
            : "advancingCount",
        message: `Etap ${index + 1} przekazuje ${advancing} osób, a etap ${index + 2} oczekuje ${next.participantCount}.`,
      });
    }
  }

  return errors;
}

export function buildStagePlan(stages: StageDraft[]): TournamentStagePlanInput {
  const errors = validateStageDrafts(stages);
  if (errors.length > 0) throw new Error(errors[0].message);

  return {
    initialParticipantCount: stages[0].participantCount,
    stages: stages.map((stage, index) => {
      const isLast = index === stages.length - 1;
      const item: TournamentStagePlanItemInput = {
        key: `stage_${index + 1}`,
        position: index + 1,
        name: stage.name.trim(),
        format: stage.format,
        participantCount: stage.participantCount,
        bestOf: stage.bestOf,
      };
      if (stage.format === "swiss") item.rounds = stage.rounds;
      if (
        !isLast &&
        (stage.format === "swiss" || stage.format === "round_robin")
      ) {
        item.advancingCount = stage.advancingCount;
      }
      if (stage.format === "group_stage") {
        item.groupCount = stage.groupCount;
        item.participantsPerGroup = stage.participantsPerGroup;
        item.qualifiersPerGroup = stage.qualifiersPerGroup;
        item.seedingMethod = "snake";
      }
      return item;
    }),
  };
}

export function withOptionalStagePlan(
  base: TournamentInput,
  enabled: boolean,
  stages: StageDraft[],
): TournamentInput {
  if (!enabled) return base;
  const stagePlan = buildStagePlan(stages);
  const first = stages[0];
  return {
    ...base,
    format: first.format === "group_stage" ? "round_robin" : first.format,
    maxPlayers: first.participantCount,
    defaultBestOf: first.bestOf,
    swissRounds: first.format === "swiss" ? first.rounds : undefined,
    stagePlan,
  };
}

export function filterMatchesForStage(
  matches: Match[],
  stageId: number,
): Match[] {
  return matches.filter((match) => match.stageId === stageId);
}

export function canShowStageActions(
  role: "organizer" | "support" | "viewer",
  hasOrganizerToken: boolean,
): boolean {
  return role === "organizer" && hasOrganizerToken;
}

export function getApiErrorMessage(error: unknown): string {
  const response = error as {
    data?: { code?: string; error?: string };
    message?: string;
  };
  const code = response?.data?.code;
  const messages: Record<string, string> = {
    STAGE_INCOMPLETE: "Nie wszystkie wymagane mecze etapu zostały zakończone.",
    STAGE_NOT_ACTIVE: "Ten etap nie jest obecnie aktywny.",
    STAGE_NOT_NEXT_PLANNED: "Można uruchomić tylko najbliższy planowany etap.",
    PREVIOUS_STAGE_NOT_COMPLETED:
      "Poprzedni etap nie został jeszcze zakończony.",
    ACTIVE_STAGE_EXISTS: "Inny etap jest już aktywny.",
    STAGE_ALREADY_COMPLETED: "Ten etap został już zakończony.",
    STAGE_ALREADY_STARTED: "Ten etap został już uruchomiony.",
    QUALIFICATION_CONFIGURATION_INVALID:
      "Konfiguracja kwalifikacji między etapami jest niespójna.",
    RANKING_INCONSISTENT: "Nie można wyliczyć jednoznacznego rankingu etapu.",
    FORBIDDEN: "Ta operacja jest dostępna wyłącznie dla organizatora.",
  };
  return (
    (code && messages[code]) ||
    response?.data?.error ||
    response?.message ||
    "Nie udało się wykonać operacji."
  );
}
