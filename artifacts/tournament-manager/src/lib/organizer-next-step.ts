import type {
  Match,
  StageStartReadiness,
  Tournament,
  TournamentStage,
} from "@workspace/api-client-react";
import type { OrganizerCapabilities } from "@/lib/organizer-capabilities";

export type OrganizerSurface = "details" | "conducting";
export type OrganizerNextStepKind =
  | "stage_preparation"
  | "planned_stage"
  | "active_matches"
  | "stage_not_materialized"
  | "swiss_round"
  | "complete_stage"
  | "next_stage"
  | "completed"
  | "no_stages"
  | "not_ready";

export interface OrganizerNextStepModel {
  kind: OrganizerNextStepKind;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  stageId?: number;
}

const formatLabels: Record<string, string> = {
  swiss: "System szwajcarski",
  round_robin: "Każdy z każdym",
  group_stage: "Faza grupowa",
  single_elimination: "Drabinka eliminacyjna",
};

export function estimateStageMatches(stage: TournamentStage): number | undefined {
  if (stage.format === "single_elimination") {
    return stage.participantCount - (stage.advancingCount ?? 1);
  }
  if (stage.format === "round_robin") {
    return (stage.participantCount * (stage.participantCount - 1)) / 2;
  }
  return undefined;
}

export function availableStageStartReadiness(
  readiness: StageStartReadiness | undefined,
  isFetching: boolean,
): StageStartReadiness | undefined {
  return isFetching ? undefined : readiness;
}

function nextPowerOfTwo(value: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(2, value)));
}

function isStageCompleteByBackendRules(
  stage: TournamentStage,
  matches: readonly Match[],
): boolean {
  if (matches.length === 0 || matches.some((match) => match.status !== "completed")) return false;
  if (stage.format === "swiss") {
    const plannedRounds = stage.plannedRounds;
    const rounds = new Set(matches.map((match) => match.round));
    return plannedRounds != null &&
      rounds.size === plannedRounds &&
      [...rounds].every((round) => round >= 1 && round <= plannedRounds);
  }
  if (stage.format === "round_robin") {
    return matches.length === (stage.participantCount * (stage.participantCount - 1)) / 2;
  }
  if (stage.format === "group_stage") {
    const groupCount = stage.groupCount;
    const groupSize = stage.participantsPerGroup;
    if (groupCount == null || groupSize == null || groupCount * groupSize !== stage.participantCount) return false;
    const expectedPerGroup = (groupSize * (groupSize - 1)) / 2;
    const matchesByGroup = new Map<number, number>();
    for (const match of matches) {
      if (match.stageGroupId == null) return false;
      matchesByGroup.set(match.stageGroupId, (matchesByGroup.get(match.stageGroupId) ?? 0) + 1);
    }
    return matches.length === groupCount * expectedPerGroup &&
      matchesByGroup.size === groupCount &&
      [...matchesByGroup.values()].every((count) => count === expectedPerGroup);
  }
  if (stage.format === "single_elimination") {
    if (matches.length !== nextPowerOfTwo(stage.participantCount) - 1) return false;
    const finalRound = Math.max(...matches.map((match) => match.round));
    const finalMatches = matches.filter((match) => match.round === finalRound);
    return finalMatches.length === 1 && finalMatches[0].winnerId != null;
  }
  return false;
}

export function deriveOrganizerNextStep(input: {
  tournament: Pick<Tournament, "id" | "status" | "currentRound" | "totalRounds">;
  stages: readonly TournamentStage[];
  matches?: readonly Match[];
  surface: OrganizerSurface;
  capabilities: OrganizerCapabilities;
  plannedStageReadiness?: StageStartReadiness;
}): OrganizerNextStepModel {
  const { tournament, matches, surface, capabilities } = input;
  const stages = [...input.stages].sort((a, b) => a.position - b.position);
  if (tournament.status === "completed") {
    return {
      kind: "completed",
      title: "Turniej zakończony",
      description: "Wszystkie etapy są zakończone. Wyniki są gotowe do udostępnienia i backupu.",
    };
  }
  if (stages.length === 0) {
    return {
      kind: "no_stages",
      title: "Brak skonfigurowanych etapów",
      description: "Plan turnieju nie zawiera etapu, który można obecnie prowadzić.",
    };
  }

  const active = stages.find((stage) => stage.status === "active");
  if (active) {
    if (matches === undefined) {
      return {
        kind: "not_ready",
        title: "Sprawdzanie stanu etapu",
        description: "Trwa pobieranie meczów. Akcja pojawi się po potwierdzeniu gotowości.",
        stageId: active.id,
      };
    }
    const stageMatches = matches.filter((match) => match.stageId === active.id);
    if (stageMatches.length === 0) {
      return {
        kind: "stage_not_materialized",
        title: "Etap nie ma jeszcze meczów",
        description: "Nie można potwierdzić gotowości do zakończenia. Sprawdź materializację etapu.",
        stageId: active.id,
      };
    }
    const completed = stageMatches.filter((match) => match.status === "completed").length;
    const remaining = stageMatches.length - completed;
    if (remaining > 0) {
      return {
        kind: "active_matches",
        title: active.name,
        description: `${completed} z ${stageMatches.length} meczów zakończonych, pozostało ${remaining}.`,
        actionLabel: surface === "details" && capabilities.canAccessConducting
          ? "Przejdź do prowadzenia"
          : undefined,
        actionHref: surface === "details" && capabilities.canAccessConducting
          ? `/tournaments/${tournament.id}/host?tab=prowadzenie`
          : undefined,
        stageId: active.id,
      };
    }
    const currentRound = active.currentRound ?? tournament.currentRound ?? 0;
    const totalRounds = active.totalRounds ?? active.plannedRounds ?? tournament.totalRounds ?? 0;
    if (active.format === "swiss" && currentRound > 0 && currentRound < totalRounds) {
      return {
        kind: "swiss_round",
        title: `Runda ${currentRound} zakończona`,
        description: `Etap ${active.name} jest gotowy na kolejną rundę.`,
        actionLabel: capabilities.canGenerateRound ? `Wygeneruj rundę ${currentRound + 1}` : undefined,
        actionHref: capabilities.canGenerateRound
          ? `/tournaments/${tournament.id}/host?tab=prowadzenie`
          : undefined,
        stageId: active.id,
      };
    }
    if (!isStageCompleteByBackendRules(active, stageMatches)) {
      return {
        kind: "not_ready",
        title: "Etap wymaga dokończenia",
        description: "Wszystkie rekordy meczów są zakończone, ale pełne warunki formatu nie zostały jeszcze spełnione.",
        stageId: active.id,
      };
    }
    const next = stages.find((stage) => stage.position === active.position + 1);
    return {
      kind: "complete_stage",
      title: "Etap gotowy do zakończenia",
      description: next
        ? `Po zatwierdzeniu kwalifikanci przejdą do etapu „${next.name}”.`
        : "Po zatwierdzeniu zostanie zakończony cały turniej.",
      actionLabel: capabilities.canManageLifecycle ? "Zakończ etap" : undefined,
      actionHref: capabilities.canManageLifecycle ? `/tournaments/${tournament.id}?tab=stages` : undefined,
      stageId: active.id,
    };
  }

  const planned = stages.find((stage) => stage.status === "planned");
  if (planned) {
    const hasCompletedPredecessor = stages.some(
      (stage) => stage.position === planned.position - 1 && stage.status === "completed",
    );
    const readiness = input.plannedStageReadiness;
    if (!readiness?.ready) {
      return {
        kind: "stage_preparation",
        title: "Etap wymaga przygotowania",
        description: readiness?.message ?? "Trwa sprawdzanie składu i konfiguracji etapu.",
        stageId: planned.id,
      };
    }
    const estimate = estimateStageMatches(planned);
    const mayAct = hasCompletedPredecessor
      ? capabilities.canManageLifecycle
      : capabilities.canStartTournament;
    return {
      kind: hasCompletedPredecessor ? "next_stage" : "planned_stage",
      title: planned.name,
      description: `${formatLabels[planned.format] ?? planned.format} · ${planned.participantCount} uczestników${estimate === undefined ? "" : ` · ${estimate} meczów`}.`,
      actionLabel: mayAct
        ? hasCompletedPredecessor ? "Rozpocznij kolejny etap" : "Rozpocznij etap"
        : undefined,
      actionHref: mayAct ? `/tournaments/${tournament.id}?tab=stages` : undefined,
      stageId: planned.id,
    };
  }

  return {
    kind: "not_ready",
    title: "Brak dostępnej akcji",
    description: "Sprawdź konfigurację etapów i aktualny stan turnieju.",
  };
}
