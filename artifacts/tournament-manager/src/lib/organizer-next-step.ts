import { t } from "@/i18n";
import type {
  Match,
  StageStartReadiness,
  Tournament,
  TournamentStage,
} from "@workspace/api-client-react";
import type { OrganizerCapabilities } from "@/lib/organizer-capabilities";
import { firstStageNeedsEntrants, stageReadinessFeedback } from "./stage-lifecycle-feedback";
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
  readinessFeedback?: ReturnType<typeof stageReadinessFeedback>;
  /** V5.11: set when the step itself explains the only blocker (entrants missing), so diagnostics can stay folded. */
  reason?: "needs_entrants";
  actionLabel?: string;
  actionHref?: string;
  stageId?: number;
}

const formatLabels: Record<string, string> = {
  get swiss() { return t("organizerNextStep.system_szwajcarski"); },
  get round_robin() { return t("organizerNextStep.kazdy_z_kazdym"); },
  get group_stage() { return t("organizerNextStep.faza_grupowa"); },
  get single_elimination() { return t("organizerNextStep.drabinka_eliminacyjna"); },
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
      title: t("organizerNextStep.turniej_zakonczony"),
      description: t("organizerNextStep.wszystkie_etapy_sa_zakonczone_wyniki"),
    };
  }
  if (stages.length === 0) {
    return {
      kind: "no_stages",
      title: t("organizerNextStep.brak_skonfigurowanych_etapow"),
      description: t("organizerNextStep.plan_turnieju_nie_zawiera_etapu"),
    };
  }

  const active = stages.find((stage) => stage.status === "active");
  if (active) {
    if (matches === undefined) {
      return {
        kind: "not_ready",
        title: t("organizerNextStep.sprawdzanie_stanu_etapu"),
        description: t("organizerNextStep.trwa_pobieranie_meczow_akcja_pojawi"),
        stageId: active.id,
      };
    }
    const stageMatches = matches.filter((match) => match.stageId === active.id);
    if (stageMatches.length === 0) {
      return {
        kind: "stage_not_materialized",
        title: t("organizerNextStep.etap_nie_ma_jeszcze_meczow"),
        description: t("organizerNextStep.nie_mozna_potwierdzic_gotowosci_do"),
        stageId: active.id,
      };
    }
    const completed = stageMatches.filter((match) => match.status === "completed").length;
    const remaining = stageMatches.length - completed;
    if (remaining > 0) {
      return {
        kind: "active_matches",
        title: active.name,
        description: t("organizerNextStep.completed_z_length_meczow_zakonczonych", { completed: completed, length: stageMatches.length, remaining: remaining }),
        actionLabel: surface === "details" && capabilities.canAccessConducting
          ? t("organizerNextStep.przejdz_do_prowadzenia")
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
        title: t("organizerNextStep.runda_currentround_zakonczona", { currentRound: currentRound }),
        description: t("organizerNextStep.etap_name_jest_gotowy_na", { name: active.name }),
        actionLabel: capabilities.canGenerateRound ? t("organizerNextStep.wygeneruj_runde_v0", { v0: currentRound + 1 }) : undefined,
        actionHref: capabilities.canGenerateRound
          ? `/tournaments/${tournament.id}/host?tab=prowadzenie`
          : undefined,
        stageId: active.id,
      };
    }
    // Stage positions can have gaps after editing; the next planned stage is the
    // next stage in the ordered plan, not necessarily position + 1.
    const next = stages.find((stage) => stage.position > active.position && stage.status === "planned");
    return {
      kind: "complete_stage",
      title: t("organizerNextStep.sprawdz_zakonczenie_etapu"),
      description: next
        ? t("organizerNextStep.wszystkie_mecze_etapu_maja_wyniki", { name: next.name })
        : t("organizerNextStep.wszystkie_mecze_etapu_maja_wyniki_2"),
      actionLabel: capabilities.canManageLifecycle ? t("organizerNextStep.zakoncz_etap") : undefined,
      actionHref: capabilities.canManageLifecycle ? `/tournaments/${tournament.id}?tab=stages&stage=${active.id}&action=complete` : undefined,
      stageId: active.id,
    };
  }

  if (input.transitionStep) return input.transitionStep;
  const planned = stages.find((stage) => stage.status === "planned");
  if (planned) {
    // Use the actual predecessor in the plan rather than assuming consecutive positions.
    const plannedIndex = stages.findIndex((stage) => stage.id === planned.id);
    const hasCompletedPredecessor = plannedIndex > 0 && stages[plannedIndex - 1].status === "completed";
    const readiness = input.plannedStageReadiness;
    if (!readiness?.ready) {
      const firstStage = plannedIndex === 0;
      const feedback = readiness ? stageReadinessFeedback(readiness, planned.name, { firstStage }) : undefined;
      // V5.11: the most common beginner case gets a concrete instruction from the engine's own counts.
      if (readiness && firstStageNeedsEntrants(readiness, firstStage)) {
        const missing = readiness.requiredParticipantCount - readiness.participantCount;
        return {
          kind: "stage_preparation",
          reason: "needs_entrants",
          title: t("organizerNextStep.dodaj_jeszcze_missing_v1", { missing: missing, v1: missing === 1 ? t("organizerNextStep.uczestnika") : t("organizerNextStep.uczestnikow") }),
          description: t("organizerNextStep.name_na_liscie_participantcount_z", { name: planned.name, participantCount: readiness.participantCount, requiredParticipantCount: readiness.requiredParticipantCount }),
          actionLabel: capabilities.canManageParticipants ? t("organizerNextStep.dodaj_uczestnikow") : undefined,
          actionHref: capabilities.canManageParticipants ? `/tournaments/${tournament.id}?tab=players` : undefined,
          stageId: planned.id,
        };
      }
      return {
        kind: "stage_preparation",
        title: t("organizerNextStep.etap_wymaga_przygotowania"),
        description: feedback?.summary ?? t("organizerNextStep.trwa_sprawdzanie_skladu_i_konfiguracji"),
        readinessFeedback: feedback,
        actionLabel: capabilities.canManageLifecycle ? t("organizerNextStep.sprawdz_gotowosc_etapu") : undefined,
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
      // V5.8: the format is named only when the stage name does not already say it ("Faza grupowa").
      description: (formatLabels[planned.format] ?? planned.format) === planned.name
        ? t("organizerNextStep.wszystko_gotowe_mozesz_zaczynac")
        : t("organizerNextStep.v0_wszystko_gotowe_mozesz_zaczynac", { v0: formatLabels[planned.format] ?? planned.format }),
      actionLabel: mayAct
        ? t("organizerNextStep.rozpocznij_etap")
        : undefined,
      actionHref: mayAct ? `/tournaments/${tournament.id}?tab=stages&stage=${planned.id}&action=start` : undefined,
      stageId: planned.id,
    };
  }

  return {
    kind: "not_ready",
    title: t("organizerNextStep.brak_dostepnej_akcji"),
    description: t("organizerNextStep.sprawdz_konfiguracje_etapow_i_aktualny"),
  };
}
