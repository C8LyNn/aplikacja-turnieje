import { t } from "@/i18n";
/**
 * Experimental wording for the organizer's next step: the title names the action
 * ("Rozegraj mecze · Etap 1") instead of only the stage name. Logic is unchanged.
 */
export function experimentalNextStep<T extends { kind: string; title: string }>(step: T): T;
export function experimentalNextStep<T extends { kind: string; title: string }>(step: T | null | undefined): T | null | undefined;
export function experimentalNextStep<T extends { kind: string; title: string }>(step: T | null | undefined) {
  if (!step) return step;
  switch (step.kind) {
    case "active_matches":
      return { ...step, title: t("experimentalNextStep.rozegraj_mecze_title", { title: step.title }) };
    case "planned_stage":
      return { ...step, title: t("experimentalNextStep.rozpocznij_etap_title", { title: step.title }) };
    case "next_stage":
      return { ...step, title: t("experimentalNextStep.rozpocznij_kolejny_etap_title", { title: step.title }) };
    default:
      return step;
  }
}

/**
 * V5.8 · one rule for every organizer page: a draft with fewer than 2 participants asks for participants,
 * instead of stage-consistency diagnostics ("Oczekiwano: 0 · Aktualnie: 0"). The tournament page and the host
 * used to disagree on this state. Logic of the engine is unchanged; only the step shown is chosen here.
 */
export function experimentalDraftNextStep<T extends { kind: string; title: string }>(
  step: T | null | undefined,
  input: { tournamentStatus?: string; participantCount: number | null | undefined; tournamentId: number },
) {
  const entrants = draftEntrantsStep(step, input);
  return entrants === step ? experimentalNextStep(step) : entrants;
}

/**
 * QW-04 · the same rule without the Experimental wording, for the Stable host's "Co teraz?": a draft with fewer
 * than 2 participants asks for participants instead of showing stage-consistency diagnostics.
 */
export function draftEntrantsStep<T extends { kind: string; title: string }>(
  step: T | null | undefined,
  input: { tournamentStatus?: string; participantCount: number | null | undefined; tournamentId: number },
) {
  const count = input.participantCount;
  if (input.tournamentStatus === "draft" && count != null && count < 2 && step && ["stage_preparation", "not_ready", "planned_stage"].includes(step.kind)) {
    return {
      kind: "stage_preparation" as const,
      reason: "needs_entrants" as const,
      title: t("experimentalNextStep.dodaj_uczestnikow"),
      description: count === 0
        ? t("experimentalNextStep.turniej_jest_gotowy_do_zapisow")
        : t("experimentalNextStep.masz_1_uczestnika_do_rozpoczecia"),
      actionLabel: t("experimentalNextStep.dodaj_uczestnikow"),
      actionHref: `/tournaments/${input.tournamentId}?tab=players`,
    };
  }
  return step;
}
