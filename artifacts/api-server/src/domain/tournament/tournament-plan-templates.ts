/**
 * PACK 05 — pure, deterministic tournament template suggestions.
 * No persistence, no participants are enrolled, no rounds are materialized.
 * The existing authoritative V1 stage-plan validator remains the gate.
 */
import { compileV1StagePlanToRoutingV2, doubleEliminationFormatEngineV2 } from "./v2";
import {
  validateTournamentStagePlan,
  type TournamentStagesPlan,
  type StageBestOf,
} from "./tournament-stage-plan";

export const PLAN_TEMPLATE_IDS = [
  "quick_elimination",
  "double_chance",
  "everyone_plays",
  "swiss",
  "groups_to_playoffs",
  "swiss_to_playoffs",
] as const;
export type PlanTemplateId = (typeof PLAN_TEMPLATE_IDS)[number];

const LABELS: Record<PlanTemplateId, string> = {
  quick_elimination: "Szybka drabinka (SE)",
  double_chance: "Druga szansa (DE)",
  everyone_plays: "Każdy z każdym",
  swiss: "System szwajcarski",
  groups_to_playoffs: "Grupy i play-off",
  swiss_to_playoffs: "Swiss i play-off",
};

export class PlanTemplateError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "PlanTemplateError";
  }
}

export interface PlanTemplateInput {
  templateId: PlanTemplateId;
  participantCount: number;
  bestOf: StageBestOf;
}

export interface PlanTemplateSummary {
  version: 1;
  templateId: PlanTemplateId;
  label: string;
  /** Pass as `stagePlan` into POST /tournaments. Still validated on creation. */
  stagePlan: TournamentStagesPlan;
  stages: Array<{
    position: number;
    name: string;
    format: string;
    participantCount: number;
    advancingCount: number | null;
    estimatedMatches: number;
  }>;
  estimatedTotalMatches: number;
  estimatedMatchesMaximum: number;
  warnings: string[];
  advisory: true;
  requiresConfirmation: true;
}

const pow2 = (n: number): boolean => n > 0 && (n & (n - 1)) === 0;
const swissRounds = (n: number): number => Math.min(10, Math.ceil(Math.log2(n)) + 1, n - 1);
const common = (key: string, position: number, name: string, participantCount: number,
  bestOf: StageBestOf) => ({
    key, position, name, participantCount, bestOf,
    entrySeedingMethod: "registration_order" as const,
    randomRevealOrder: "instant" as const,
  });

function validateInput(input: unknown): asserts input is PlanTemplateInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new PlanTemplateError("INVALID_TEMPLATE_REQUEST", "Oczekiwano parametrów szablonu.");
  }
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some(key => !["templateId", "participantCount", "bestOf"].includes(key))) {
    throw new PlanTemplateError("INVALID_TEMPLATE_REQUEST", "Nieznany parametr konfiguracji.");
  }
  if (!PLAN_TEMPLATE_IDS.includes(value.templateId as PlanTemplateId)) {
    throw new PlanTemplateError("UNKNOWN_TEMPLATE", "Nieznany szablon turnieju.");
  }
  if (!Number.isInteger(value.participantCount) || (value.participantCount as number) < 2 || (value.participantCount as number) > 128) {
    throw new PlanTemplateError("INVALID_PARTICIPANT_COUNT", "Podaj liczbę uczestników od 2 do 128.");
  }
  if (![1, 3, 5, 7].includes(value.bestOf as number)) {
    throw new PlanTemplateError("INVALID_BEST_OF", "Obsługiwane są BO1, BO3, BO5 i BO7.");
  }
}

/** Always validate the *exact* suggested plan with the production plan validator. */
export function previewTournamentTemplate(input: unknown): PlanTemplateSummary {
  validateInput(input);
  const { templateId, participantCount: n, bestOf } = input;
  let stages: TournamentStagesPlan["stages"];
  const warnings: string[] = [];
  const notes = new Map<number, { advancingCount: number | null; matches: number; max: number }>();

  switch (templateId) {
    case "quick_elimination":
      stages = [{ ...common("playoff", 1, "Drabinka pucharowa", n, bestOf),
        format: "single_elimination", placementMethod: "standard" }];
      notes.set(1, { advancingCount: null, matches: n - 1, max: n - 1 });
      break;
    case "double_chance":
      // Conservative boundaries: the DE routing engine is not promised to handle
      // arbitrary participant counts, or >64-team brackets, from this wizard.
      if (n < 4 || n > 64 || !pow2(n)) {
        throw new PlanTemplateError("DOUBLE_ELIMINATION_REQUIRES_POWER_OF_TWO",
          "Ten szablon DE obsługuje 4–64 uczestników w liczbie będącej potęgą dwóch.");
      }
      stages = [{ ...common("double", 1, "Drabinka podwójnej eliminacji", n, bestOf),
        format: "double_elimination", placementMethod: "standard" }];
      notes.set(1, { advancingCount: null, matches: 2 * n - 2, max: 2 * n - 1 });
      warnings.push("Finał DE może wymagać dodatkowego meczu resetującego.");
      break;
    case "everyone_plays":
      if (n > 32) {
        throw new PlanTemplateError("ROUND_ROBIN_TOO_LARGE",
          "Szablon każdy z każdym jest ograniczony do 32 uczestników — większy turniej generuje bardzo wiele meczów.");
      }
      stages = [{ ...common("league", 1, "Każdy z każdym", n, bestOf),
        format: "round_robin" }];
      notes.set(1, { advancingCount: null, matches: n * (n - 1) / 2, max: n * (n - 1) / 2 });
      break;
    case "swiss": {
      const rounds = swissRounds(n);
      stages = [{ ...common("swiss", 1, "System szwajcarski", n, bestOf),
        format: "swiss", rounds }];
      const matchCount = Math.floor(n / 2) * rounds;
      notes.set(1, { advancingCount: null, matches: matchCount, max: matchCount });
      if (n % 2 === 1) warnings.push("Nieparzysta liczba uczestników wymaga obsługi wolnego losu w każdej rundzie.");
      warnings.push("Liczba meczów Swiss jest orientacyjna; zależy od rozstrzygnięcia wolnych losów i reguł parowania.");
      break;
    }
    case "groups_to_playoffs": {
      if (n < 8 || n > 64 || n % 4 !== 0) {
        throw new PlanTemplateError("GROUP_TEMPLATE_REQUIRES_FOURS",
          "Ten szablon wymaga 8–64 uczestników i pełnych grup czteroosobowych.");
      }
      const groupCount = n / 4;
      const qualifying = groupCount * 2;
      stages = [
        { ...common("groups", 1, "Faza grupowa", n, bestOf),
          format: "group_stage", groupCount, participantsPerGroup: 4, qualifiersPerGroup: 2,
          placementMethod: "snake", resultSeedingMethod: "rank_bands" },
        { ...common("playoff", 2, "Play-off", qualifying, bestOf),
          format: "single_elimination", placementMethod: "standard" },
      ];
      notes.set(1, { advancingCount: qualifying, matches: 6 * groupCount, max: 6 * groupCount });
      notes.set(2, { advancingCount: null, matches: qualifying - 1, max: qualifying - 1 });
      if (!pow2(qualifying)) warnings.push("Drabinka play-off będzie zawierać systemowe wolne losy (BYE).");
      break;
    }
    case "swiss_to_playoffs": {
      if (n < 8 || n > 64 || !pow2(n)) {
        throw new PlanTemplateError("SWISS_PLAYOFFS_REQUIRES_POWER_OF_TWO",
          "Ten szablon wymaga 8–64 uczestników w liczbie będącej potęgą dwóch.");
      }
      const rounds = swissRounds(n);
      const qualifying = n / 2;
      stages = [
        { ...common("swiss", 1, "Eliminacje Swiss", n, bestOf),
          format: "swiss", rounds, advancingCount: qualifying },
        { ...common("playoff", 2, "Play-off", qualifying, bestOf),
          format: "single_elimination", placementMethod: "standard" },
      ];
      notes.set(1, { advancingCount: qualifying, matches: n / 2 * rounds, max: n / 2 * rounds });
      notes.set(2, { advancingCount: null, matches: qualifying - 1, max: qualifying - 1 });
      warnings.push("Liczba meczów Swiss jest orientacyjna; zależy od faktycznych parowań.");
      break;
    }
  }
  // Authoritative engine validation — no second rulebook for the planner.
  const validation = validateTournamentStagePlan({ initialParticipantCount: n, stages });
  if (!validation.valid) {
    throw new PlanTemplateError("TEMPLATE_PLAN_REJECTED",
      `Silnik turniejowy odrzucił plan: ${validation.problems.map(p => p.message).join("; ")}`);
  }
  const plan = validation.value;
  // Mirror the non-database DE preflight that the creation command performs.
  if (plan.stages.some(stage => stage.format === "double_elimination")) {
    const compiled = compileV1StagePlanToRoutingV2(plan, [doubleEliminationFormatEngineV2]);
    if (!compiled.valid) {
      throw new PlanTemplateError("DE_ROUTING_PLAN_REJECTED",
        "Silnik routingu DE nie zaakceptował tej konfiguracji.");
    }
  }
  const summaries = plan.stages.map(s => ({
    position: s.position, name: s.name, format: s.format,
    participantCount: s.participantCount,
    advancingCount: notes.get(s.position)?.advancingCount ?? null,
    estimatedMatches: notes.get(s.position)?.matches ?? 0,
  }));
  return {
    version: 1, templateId, label: LABELS[templateId], stagePlan: plan,
    stages: summaries,
    estimatedTotalMatches: [...notes.values()].reduce((sum, item) => sum + item.matches, 0),
    estimatedMatchesMaximum: [...notes.values()].reduce((sum, item) => sum + item.max, 0),
    warnings, advisory: true, requiresConfirmation: true,
  };
}
