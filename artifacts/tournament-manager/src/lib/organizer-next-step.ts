import type {
  Match,
  StageStartReadiness,
  Tournament,
  TournamentStage,
} from "@workspace/api-client-react";
import type { OrganizerCapabilities } from "@/lib/organizer-capabilities";
import { stageReadinessMessages } from "./stage-lifecycle-feedback";
import { organizerStageSummary } from "./organizer-stage-summary";

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

export function deriveOrganizerNextStep(input: {
  tournament: Pick<Tournament, "id" | "status" | "currentRound" | "totalRounds">;
  stages: readonly TournamentStage[];
  matches?: readonly Match[];
  surface: OrganizerSurface;
  capabilities: OrganizerCapabilities;
  plannedStageReadiness?: StageStartReadiness;
  transitionStep?: OrganizerNextStepModel;
}): OrganizerNextStepModel {
  const { tournament, matches, surface, capabilities } = input;
  const stages = [...input.stages].sort((a, b) => a.position - b.position);
  if (tournament.status === "completed" && !stages.some(s => s.status !== "completed") && !input.transitionStep) {
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
    const currentRound = organizerStageSummary(active, matches).round ?? active.currentRound ?? 0;
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
    const next = stages.find((stage) => stage.position === active.position + 1);
    return {
      kind: "complete_stage",
      title: "Sprawdź zakończenie etapu",
      description: next
        ? `Serwer sprawdzi wyniki i kwalifikację. Przed rozpoczęciem etapu „${next.name}” trzeba potwierdzić jego gotowość.`
        : "Serwer sprawdzi wyniki i warunki zakończenia etapu.",
      actionLabel: capabilities.canManageLifecycle ? "Zakończ etap" : undefined,
      actionHref: capabilities.canManageLifecycle ? `/tournaments/${tournament.id}?tab=stages&stage=${active.id}&action=complete` : undefined,
      stageId: active.id,
    };
  }

  if (input.transitionStep) return input.transitionStep;
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
        description: readiness ? stageReadinessMessages(readiness, { stages, stageId: planned.id }).join(" ") : "Trwa sprawdzanie składu i konfiguracji etapu.",
        actionLabel: capabilities.canManageLifecycle ? "Sprawdź gotowość etapu" : undefined,
        actionHref: capabilities.canManageLifecycle ? `/tournaments/${tournament.id}?tab=stages` : undefined,
        stageId: planned.id,
      };
    }
    const mayAct = hasCompletedPredecessor
      ? capabilities.canManageLifecycle
      : capabilities.canStartTournament;
    return {
      kind: hasCompletedPredecessor ? "next_stage" : "planned_stage",
      title: planned.name,
      description: `${formatLabels[planned.format] ?? planned.format} · Gotowy. Skład i konfiguracja potwierdzone przez serwer.`,
      actionLabel: mayAct
        ? "Rozpocznij etap"
        : undefined,
      actionHref: mayAct ? `/tournaments/${tournament.id}?tab=stages&stage=${planned.id}&action=start` : undefined,
      stageId: planned.id,
    };
  }

  return {
    kind: "not_ready",
    title: "Brak dostępnej akcji",
    description: "Sprawdź konfigurację etapów i aktualny stan turnieju.",
  };
}
