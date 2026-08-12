import type {
  Match,
  TournamentInput,
  TournamentStagePlanInput,
  TournamentStagePlanItemInput,
} from "@workspace/api-client-react";
import type { DeadlockHeroId } from "@workspace/game-catalog";

export type StageFormat = TournamentStagePlanItemInput["format"];
export type EntrySeedingMethod = "preserve" | "registration_order" | "alphabetical" | "random" | "manual";
export type StagePlacementMethod = "standings_order" | "snake" | "random" | "standard";
export type GroupResultSeedingMethod = "rank_bands" | "global_ranking";
export type RandomRevealOrder = "instant" | "sequential";

export interface StageDraft {
  clientId: string;
  name: string;
  format: StageFormat;
  participantCount: number;
  bestOf: 1 | 3 | 5 | 7;
  rounds?: number;
  advancingCount?: number;
  groupCount?: number;
  /** Derived largest group size. */
  participantsPerGroup?: number;
  /** Maximum number advancing from each group; smaller groups may advance everyone. */
  qualifiersPerGroup?: number;
  entrySeedingMethod: EntrySeedingMethod;
  placementMethod: StagePlacementMethod;
  resultSeedingMethod: GroupResultSeedingMethod;
  randomSeed?: string;
  randomRevealOrder: RandomRevealOrder;
  /** Deadlock-only global bans introduced by this stage. Inherited bans are derived. */
  additionalHeroBans: DeadlockHeroId[];
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
  double_elimination: "Podwójna eliminacja",
};

export const ENTRY_SEEDING_LABELS: Record<EntrySeedingMethod, string> = {
  preserve: "Zachowaj otrzymane seedy",
  registration_order: "Kolejność dodania",
  alphabetical: "Alfabetycznie",
  random: "Losowo (deterministycznie)",
  manual: "Ręcznie ustawione seedy graczy",
};

export function groupLabelFromIndex(index: number): string {
  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError("Group index must be a non-negative integer.");
  }
  let value = index + 1;
  let label = "";
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
}

export const STAGE_STATUS_LABELS = {
  planned: "Planowany",
  active: "Aktywny",
  completed: "Ukończony",
} as const;

export function balancedGroupSizes(participantCount: number, groupCount: number): number[] {
  if (!Number.isInteger(participantCount) || participantCount < 2 || !Number.isInteger(groupCount) || groupCount < 1 || groupCount > Math.floor(participantCount / 2)) return [];
  const smallerSize = Math.floor(participantCount / groupCount);
  const largerGroupCount = participantCount % groupCount;
  return Array.from({ length: groupCount }, (_, index) => smallerSize + (index < largerGroupCount ? 1 : 0));
}

export function groupAdvancingCount(stage: Pick<StageDraft, "participantCount" | "groupCount" | "qualifiersPerGroup">): number {
  const sizes = balancedGroupSizes(stage.participantCount, stage.groupCount ?? 0);
  const qualifierLimit = stage.qualifiersPerGroup ?? 0;
  if (sizes.length === 0 || !Number.isInteger(qualifierLimit) || qualifierLimit < 1) return 0;
  return sizes.reduce((sum, size) => sum + Math.min(size, qualifierLimit), 0);
}

export function stageOutputParticipantCount(stage: Pick<StageDraft, "format" | "participantCount" | "advancingCount" | "groupCount" | "qualifiersPerGroup">): number {
  if (stage.format === "group_stage") return groupAdvancingCount(stage);
  if (stage.format === "swiss" || stage.format === "round_robin" || stage.format === "single_elimination") {
    return stage.advancingCount ?? (stage.format === "single_elimination" ? 1 : stage.participantCount);
  }
  if (stage.format === "double_elimination") return 1;
  return 1;
}

function nextPowerOfTwo(value: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(2, value)));
}

export function singleEliminationAdvancingOptions(participantCount: number): number[] {
  if (!Number.isInteger(participantCount) || participantCount < 2) return [];
  const options: number[] = [];
  for (let remaining = nextPowerOfTwo(participantCount) / 2; remaining >= 1; remaining /= 2) {
    options.push(remaining);
  }
  return options;
}

export function singleEliminationStageMetrics(
  stage: Pick<StageDraft, "participantCount" | "advancingCount">,
): { advancingCount: number; rounds: number; matchCount: number; bracketSize: number } | null {
  const advancingCount = stage.advancingCount ?? 1;
  if (!singleEliminationAdvancingOptions(stage.participantCount).includes(advancingCount)) return null;
  const bracketSize = nextPowerOfTwo(stage.participantCount);
  return {
    advancingCount,
    rounds: Math.log2(bracketSize / advancingCount),
    matchCount: stage.participantCount - advancingCount,
    bracketSize,
  };
}

function normalizeStageForFlow(stage: StageDraft, participantCount: number, isLast: boolean): StageDraft {
  let normalized: StageDraft = { ...stage, participantCount };
  if (normalized.format === "group_stage") {
    const maxGroups = Math.max(1, Math.floor(participantCount / 2));
    const groupCount = Math.min(Math.max(1, normalized.groupCount ?? 2), maxGroups);
    const sizes = balancedGroupSizes(participantCount, groupCount);
    const largest = Math.max(...sizes);
    let qualifiersPerGroup = Math.min(Math.max(1, normalized.qualifiersPerGroup ?? 2), largest);
    if (!isLast && sizes.reduce((sum, size) => sum + Math.min(size, qualifiersPerGroup), 0) < 2) {
      qualifiersPerGroup = Math.min(2, largest);
    }
    normalized = {
      ...normalized,
      groupCount,
      participantsPerGroup: largest,
      qualifiersPerGroup,
    };
  }
  if (isLast) return { ...normalized, advancingCount: undefined };
  if (normalized.format === "double_elimination") return normalized;
  if (normalized.format === "single_elimination") {
    const options = singleEliminationAdvancingOptions(participantCount);
    return {
      ...normalized,
      advancingCount: options.includes(normalized.advancingCount ?? 0)
        ? normalized.advancingCount
        : options[0],
    };
  }
  if (normalized.format === "swiss" || normalized.format === "round_robin") {
    const current = normalized.advancingCount;
    return {
      ...normalized,
      advancingCount: Number.isInteger(current) && current! >= 2 && current! <= participantCount
        ? current
        : Math.max(2, Math.min(participantCount, Math.floor(participantCount / 2))),
    };
  }
  return normalized;
}

/** Recomputes every derived input count without mutating the form state. */
export function synchronizeStageParticipantFlow(stages: readonly StageDraft[]): StageDraft[] {
  const result: StageDraft[] = [];
  stages.forEach((stage, index) => {
    const participantCount = index === 0
      ? stage.participantCount
      : stageOutputParticipantCount(result[index - 1]);
    result.push(normalizeStageForFlow(stage, participantCount, index === stages.length - 1));
  });
  return result;
}

function defaultPlacement(format: StageFormat): StagePlacementMethod {
  if (format === "group_stage") return "snake";
  if (format === "single_elimination" || format === "double_elimination") return "standard";
  return "standings_order";
}

export function createStageDraft(position: number, format: StageFormat = "swiss"): StageDraft {
  return {
    clientId: globalThis.crypto?.randomUUID?.() ?? `stage-${Date.now()}-${position}`,
    name: `Etap ${position}`,
    format,
    participantCount: 8,
    bestOf: 1,
    rounds: format === "swiss" ? 3 : undefined,
    advancingCount: format === "swiss" || format === "round_robin" ? 4 : undefined,
    groupCount: format === "group_stage" ? 2 : undefined,
    participantsPerGroup: format === "group_stage" ? 4 : undefined,
    qualifiersPerGroup: format === "group_stage" ? 2 : undefined,
    entrySeedingMethod: "preserve",
    placementMethod: defaultPlacement(format),
    resultSeedingMethod: "rank_bands",
    randomSeed: `stage-${position}-seed`,
    randomRevealOrder: "instant",
    additionalHeroBans: [],
  };
}

/** Copies authoring configuration only; runtime stage state is never part of StageDraft. */
export function copyStageDraftForNextStage(previous: StageDraft, position: number): StageDraft {
  return {
    ...previous,
    clientId: globalThis.crypto?.randomUUID?.() ?? `stage-${Date.now()}-${position}`,
    name: `Etap ${position}`,
    advancingCount: undefined,
    additionalHeroBans: [],
  };
}

export function normalizeStageDrafts(stages: StageDraft[]): StageDraft[] {
  return synchronizeStageParticipantFlow(stages.map((stage, index) => ({
    ...stage,
    name: /^Etap \d+$/.test(stage.name) ? `Etap ${index + 1}` : stage.name,
    entrySeedingMethod: stage.entrySeedingMethod ?? "preserve",
    placementMethod: stage.placementMethod ?? defaultPlacement(stage.format),
    resultSeedingMethod: stage.resultSeedingMethod ?? "rank_bands",
    randomRevealOrder: stage.randomRevealOrder ?? "instant",
    randomSeed: stage.randomSeed ?? `stage-${index + 1}-seed`,
    additionalHeroBans: stage.additionalHeroBans ?? [],
  })));
}

export function stageUsesRandom(stage: Pick<StageDraft, "format" | "entrySeedingMethod" | "placementMethod">): boolean {
  return stage.entrySeedingMethod === "random" ||
    (stage.format === "group_stage" && stage.placementMethod === "random") ||
    (["single_elimination", "double_elimination"].includes(stage.format) && stage.placementMethod === "random");
}

export function validateStageDrafts(stages: StageDraft[]): StagePlanValidationError[] {
  const errors: StagePlanValidationError[] = [];
  if (stages.length < 1 || stages.length > 10) {
    errors.push({ message: "Plan musi zawierać od 1 do 10 etapów." });
    return errors;
  }
  stages.forEach((stage, index) => {
    const isLast = index === stages.length - 1;
    if (!stage.name.trim()) errors.push({ stageIndex: index, field: "name", message: `Etap ${index + 1} wymaga nazwy.` });
    if (!Number.isInteger(stage.participantCount) || stage.participantCount < 2) errors.push({ stageIndex: index, field: "participantCount", message: `Etap ${index + 1} wymaga co najmniej 2 uczestników.` });
    if (![1, 3, 5, 7].includes(stage.bestOf)) errors.push({ stageIndex: index, field: "bestOf", message: `Etap ${index + 1} ma niepoprawne BO.` });
    if (!["preserve", "registration_order", "alphabetical", "random", "manual"].includes(stage.entrySeedingMethod)) errors.push({ stageIndex: index, field: "entrySeedingMethod", message: "Wybierz poprawną metodę nadawania seedów." });
    if (!["instant", "sequential"].includes(stage.randomRevealOrder)) errors.push({ stageIndex: index, field: "randomRevealOrder", message: "Wybierz sposób ujawnienia losowania." });
    if (stageUsesRandom(stage) && (!stage.randomSeed?.trim() || stage.randomSeed.trim().length > 200)) errors.push({ stageIndex: index, field: "randomSeed", message: "Losowe seedowanie wymaga klucza losowania od 1 do 200 znaków." });
    if (stage.format === "swiss" && (!Number.isInteger(stage.rounds) || (stage.rounds ?? 0) < 1)) errors.push({ stageIndex: index, field: "rounds", message: `Etap ${index + 1} wymaga liczby rund Swiss.` });
    if (stage.format === "single_elimination") {
      if (!["standard", "random"].includes(stage.placementMethod)) errors.push({ stageIndex: index, field: "placementMethod", message: "Drabinka wymaga standardowego albo losowego rozmieszczenia." });
      if (!isLast) {
        const options = singleEliminationAdvancingOptions(stage.participantCount);
        if (!options.includes(stage.advancingCount ?? 0)) {
          errors.push({
            stageIndex: index,
            field: "advancingCount",
            message: `Drabinka kwalifikacyjna może przekazać wyłącznie: ${options.join(", ")} uczestników.`,
          });
        }
      }
    } else if (stage.format === "double_elimination") {
      if (!isLast) errors.push({ stageIndex: index, field: "format", message: "Podwójna eliminacja musi być ostatnim etapem." });
      if (stage.placementMethod !== "standard") errors.push({ stageIndex: index, field: "placementMethod", message: "Podwójna eliminacja używa standardowego rozstawienia." });
    } else if (stage.format !== "group_stage" && stage.placementMethod !== "standings_order") {
      errors.push({ stageIndex: index, field: "placementMethod", message: "Ten format używa kolejności seedów bez dodatkowego rozmieszczenia." });
    }
    if (stage.format === "group_stage") {
      if (isLast) errors.push({ stageIndex: index, field: "format", message: "Faza grupowa wymaga kolejnego etapu." });
      if (!["snake", "random"].includes(stage.placementMethod)) errors.push({ stageIndex: index, field: "placementMethod", message: "Grupy wymagają snake seeding albo losowego rozmieszczenia." });
      if (!["rank_bands", "global_ranking"].includes(stage.resultSeedingMethod)) errors.push({ stageIndex: index, field: "resultSeedingMethod", message: "Wybierz poprawny sposób nowych seedów po grupach." });
      const maxGroupCount = Math.floor(stage.participantCount / 2);
      if (!Number.isInteger(stage.groupCount) || (stage.groupCount ?? 0) < 1 || (stage.groupCount ?? 0) > maxGroupCount) errors.push({ stageIndex: index, field: "groupCount", message: `Liczba grup musi wynosić od 1 do ${Math.max(1, maxGroupCount)}, aby każda grupa miała co najmniej 2 osoby.` });
      const sizes = balancedGroupSizes(stage.participantCount, stage.groupCount ?? 0);
      const largestGroupSize = sizes.length > 0 ? Math.max(...sizes) : 0;
      if (!Number.isInteger(stage.qualifiersPerGroup) || (stage.qualifiersPerGroup ?? 0) < 1 || (stage.qualifiersPerGroup ?? 0) > largestGroupSize) errors.push({ stageIndex: index, field: "qualifiersPerGroup", message: `Maksymalna liczba kwalifikantów z grupy musi wynosić od 1 do ${Math.max(1, largestGroupSize)}.` });
      if (!isLast && sizes.length > 0 && Number.isInteger(stage.qualifiersPerGroup) && groupAdvancingCount(stage) < 2) errors.push({ stageIndex: index, field: "qualifiersPerGroup", message: "Faza grupowa musi przekazać co najmniej 2 uczestników do kolejnego etapu." });
    }
    if (!isLast && stage.format !== "group_stage" && stage.format !== "single_elimination") {
      if (!Number.isInteger(stage.advancingCount) || (stage.advancingCount ?? 0) < 2) errors.push({ stageIndex: index, field: "advancingCount", message: `Etap ${index + 1} wymaga co najmniej 2 kwalifikantów.` });
      if ((stage.advancingCount ?? 0) > stage.participantCount) errors.push({ stageIndex: index, field: "advancingCount", message: "Nie może awansować więcej osób niż gra w etapie." });
    }
  });
  for (let index = 0; index < stages.length - 1; index += 1) {
    const stage = stages[index];
    const next = stages[index + 1];
    const advancing = stageOutputParticipantCount(stage);
    if (advancing !== next.participantCount) errors.push({ stageIndex: index, field: stage.format === "group_stage" ? "qualifiersPerGroup" : "advancingCount", message: `Etap ${index + 1} przekazuje ${advancing} osób, a etap ${index + 2} oczekuje ${next.participantCount}.` });
  }
  return errors;
}

/** Deterministic FNV-1a + Mulberry32, matching the API domain implementation. */
function deterministicShuffle<T>(values: readonly T[], randomSeed: string): T[] {
  let hash = 0x811c9dc5;
  for (let index = 0; index < randomSeed.length; index += 1) {
    hash ^= randomSeed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  let state = hash >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

export function previewGroupSeedPlacement(stage: StageDraft): number[][] {
  const sizes = balancedGroupSizes(stage.participantCount, stage.groupCount ?? 0);
  if (sizes.length === 0) return [];
  const seeds = Array.from({ length: stage.participantCount }, (_, index) => index + 1);
  const groups = sizes.map(() => [] as number[]);
  if (stage.placementMethod === "random") {
    const shuffled = deterministicShuffle(seeds, `${stage.randomSeed ?? ""}:placement`);
    let offset = 0;
    sizes.forEach((size, groupIndex) => {
      groups[groupIndex].push(...shuffled.slice(offset, offset + size));
      offset += size;
    });
    return groups;
  }
  let seedIndex = 0;
  const largest = Math.max(...sizes);
  for (let tier = 0; tier < largest; tier += 1) {
    const indexes = Array.from({ length: sizes.length }, (_, index) => index);
    if (tier % 2 === 1) indexes.reverse();
    for (const groupIndex of indexes) {
      if (sizes[groupIndex] <= tier) continue;
      groups[groupIndex].push(seeds[seedIndex++]);
    }
  }
  return groups;
}

function standardBracketSeedOrder(size: number): number[] {
  if (size === 2) return [1, 2];
  const previous = standardBracketSeedOrder(size / 2);
  return previous.flatMap((seed) => [seed, size + 1 - seed]);
}
export function previewBracketPairs(stage: StageDraft): Array<[number | null, number | null]> {
  if (stage.participantCount < 2) return [];
  const size = nextPowerOfTwo(stage.participantCount);
  const participantSeeds = Array.from({ length: stage.participantCount }, (_, index) => index + 1);
  const placed = stage.placementMethod === "random"
    ? deterministicShuffle(participantSeeds, `${stage.randomSeed ?? ""}:placement`)
    : participantSeeds;
  const participantByPlacement = new Map(placed.map((seed, index) => [index + 1, seed]));
  const slots = standardBracketSeedOrder(size).map((placementSeed) => participantByPlacement.get(placementSeed) ?? null);
  const pairs: Array<[number | null, number | null]> = [];
  for (let index = 0; index < slots.length; index += 2) pairs.push([slots[index], slots[index + 1]]);
  return pairs;
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
        entrySeedingMethod: stage.entrySeedingMethod,
        placementMethod: stage.placementMethod,
        resultSeedingMethod: stage.format === "group_stage" ? stage.resultSeedingMethod : undefined,
        randomRevealOrder: stage.randomRevealOrder,
        randomSeed: stageUsesRandom(stage) ? stage.randomSeed?.trim() : undefined,
      };
      if (stage.format === "swiss") item.rounds = stage.rounds;
      if (!isLast && (stage.format === "swiss" || stage.format === "round_robin" || stage.format === "single_elimination")) item.advancingCount = stage.advancingCount;
      if (stage.format === "group_stage") {
        const sizes = balancedGroupSizes(stage.participantCount, stage.groupCount ?? 0);
        item.groupCount = stage.groupCount;
        item.participantsPerGroup = Math.max(...sizes);
        item.qualifiersPerGroup = stage.qualifiersPerGroup;
        item.seedingMethod = stage.placementMethod === "random" ? "random" : "snake";
      }
      return item;
    }),
  };
}

export function withOptionalStagePlan(base: TournamentInput, enabled: boolean, stages: StageDraft[]): TournamentInput {
  if (!enabled) return base;
  const stagePlan = buildStagePlan(stages);
  const first = stages[0];
  const gameConfig = base.gameConfig?.gameId === "deadlock"
    ? {
        ...base.gameConfig,
        config: {
          ...base.gameConfig.config,
          stageBans: stages
            .map((stage, index) => ({
              stageKey: `stage_${index + 1}`,
              bannedHeroIds: stage.additionalHeroBans,
            }))
            .filter((entry) => entry.bannedHeroIds.length > 0),
        },
      }
    : base.gameConfig;
  return {
    ...base,
    format: first.format === "group_stage"
      ? "round_robin"
      : first.format === "double_elimination"
        ? "single_elimination"
        : first.format,
    maxPlayers: first.participantCount,
    defaultBestOf: first.bestOf,
    swissRounds: first.format === "swiss" ? first.rounds : undefined,
    gameConfig,
    stagePlan,
  };
}

export function filterMatchesForStage(matches: Match[], stageId: number): Match[] {
  return matches.filter((match) => match.stageId === stageId);
}
export function canShowStageActions(role: "organizer" | "support" | "viewer", hasOrganizerToken: boolean): boolean {
  return role === "organizer" && hasOrganizerToken;
}
export function getApiErrorMessage(error: unknown): string {
  const response = error as { data?: { code?: string; error?: string }; message?: string };
  const code = response?.data?.code;
  const messages: Record<string, string> = {
    STAGE_INCOMPLETE: "Nie wszystkie wymagane mecze etapu zostały zakończone.",
    STAGE_NOT_ACTIVE: "Ten etap nie jest obecnie aktywny.",
    STAGE_NOT_NEXT_PLANNED: "Można uruchomić tylko najbliższy planowany etap.",
    PREVIOUS_STAGE_NOT_COMPLETED: "Poprzedni etap nie został jeszcze zakończony.",
    ACTIVE_STAGE_EXISTS: "Inny etap jest już aktywny.",
    STAGE_ALREADY_COMPLETED: "Ten etap został już zakończony.",
    STAGE_ALREADY_STARTED: "Ten etap został już uruchomiony.",
    QUALIFICATION_CONFIGURATION_INVALID: "Konfiguracja kwalifikacji między etapami jest niespójna.",
    STAGE_SEEDING_CONFIGURATION_INVALID: "Konfiguracja seedowania lub rozmieszczenia jest niespójna.",
    RANKING_INCONSISTENT: "Nie można wyliczyć jednoznacznego rankingu etapu.",
    FORBIDDEN: "Ta operacja jest dostępna wyłącznie dla organizatora.",
  };
  return (code && messages[code]) || response?.data?.error || response?.message || "Nie udało się wykonać operacji.";
}
