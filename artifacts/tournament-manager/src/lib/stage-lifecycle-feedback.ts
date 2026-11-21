import { t } from "@/i18n";
import type { StageStartReadiness } from "@workspace/api-client-react";
import { getApiErrorMessage } from "./tournament-stages-ui";
import { configurationProblemMessage, type ConfigurationContext } from "./stage-configuration-feedback";

/** Presentation only: readiness and counts remain authoritative server values. */
/** True when the first stage simply has fewer entrants than it needs (the common beginner case). */
export function firstStageNeedsEntrants(readiness: StageStartReadiness, firstStage: boolean): boolean {
  return firstStage && !readiness.ready && readiness.reasonCode === "STAGE_PARTICIPANTS_INCONSISTENT"
    && readiness.participantCount < readiness.requiredParticipantCount;
}

export function stageReadinessFeedback(readiness: StageStartReadiness, stageName: string, options: { firstStage?: boolean } = {}) {
  const messages: Record<string, [string, string]> = {
    STAGE_PARTICIPANTS_INCONSISTENT: [t("stageLifecycleFeedback.sklad_lub_seedy_etapu_sa"), t("stageLifecycleFeedback.sprawdz_przypisania_uczestnikow_i_seedy")],
    STAGE_BASKET_CONFIGURATION_INVALID: [t("stageLifecycleFeedback.konfiguracja_koszykow_zawiera_bledy"), t("stageLifecycleFeedback.sprawdz_koszyki_i_doplyw_uczestnikow")],
    QUALIFICATION_CONFIGURATION_INVALID: [t("stageLifecycleFeedback.konfiguracja_kwalifikacji_jest_nieprawid"), t("stageLifecycleFeedback.sprawdz_ustawienia_kwalifikacji_i_koszyk")],
    PREVIOUS_STAGE_NOT_COMPLETED: [t("stageLifecycleFeedback.poprzedni_etap_nie_zostal_zakonczony"), t("stageLifecycleFeedback.sprawdz_zakonczenie_poprzedniego_etapu")],
  };
  const predefined = Object.prototype.hasOwnProperty.call(messages, readiness.reasonCode)
    ? messages[readiness.reasonCode]
    : undefined;
  let [reason, action] = predefined ?? [readiness.message, t("stageLifecycleFeedback.sprawdz_szczegoly_gotowosci_etapu")];
  if (readiness.reasonCode === "STAGE_PARTICIPANTS_INCONSISTENT" && readiness.requiredParticipantCount !== readiness.participantCount) {
    reason = t("stageLifecycleFeedback.liczba_uczestnikow_nie_odpowiada_wymagan");
    action = t("stageLifecycleFeedback.sprawdz_przypisania_i_doplyw_uczestnikow");
  }
  if (firstStageNeedsEntrants(readiness, options.firstStage === true)) {
    const missing = readiness.requiredParticipantCount - readiness.participantCount;
    reason = t("stageLifecycleFeedback.brakuje_uczestnikow_etap_potrzebuje_requ", { requiredParticipantCount: readiness.requiredParticipantCount, participantCount: readiness.participantCount });
    action = t("stageLifecycleFeedback.dodaj_jeszcze_missing_w_zakladce", { missing: missing });
  }
  return {
    summary: `${stageName}: ${reason}`,
    action,
    counts: t("stageLifecycleFeedback.oczekiwano_requiredparticipantcount_aktu", { requiredParticipantCount: readiness.requiredParticipantCount, participantCount: readiness.participantCount }),
  };
}

export function stageReadinessMessages(readiness: StageStartReadiness, context: ConfigurationContext = {}): string[] {
  if (readiness.ready) return [];
  return [...new Set([
    readiness.reasonCode === "STAGE_PARTICIPANTS_INCONSISTENT"
      ? configurationProblemMessage({ code: readiness.reasonCode, message: readiness.message, expected: readiness.requiredParticipantCount, actual: readiness.participantCount }, context)
      : readiness.message,
    readiness.message,
    ...(readiness.missingSeeds.length ? [t("stageLifecycleFeedback.brakujace_seedy_v0", { v0: readiness.missingSeeds.join(", ") })] : []),
    ...readiness.basketValidation.problems.map(problem => configurationProblemMessage(problem, context)),
    ...readiness.basketValidation.problems.map(problem => problem.message),
  ].filter(Boolean))];
}

export function stageLifecycleError(error: unknown): string {
  const response = error as { status?: number; data?: { code?: unknown; error?: unknown }; message?: unknown } | null;
  // Unknown API responses must not use inherited Object prototype keys as error codes.
  const rawCode = response?.data?.code;
  const code = typeof rawCode === "string" && /^[A-Z][A-Z0-9_]{0,127}$/.test(rawCode)
    ? rawCode : undefined;
  const rawDetail = code ? getApiErrorMessage(error) : response?.data?.error;
  const detail = typeof rawDetail === "string" ? rawDetail : "";
  const qualificationMessages: Record<string, string> = {
    STAGE_BASKET_CONFIGURATION_NOT_EXPLICIT: t("stageLifecycleFeedback.ten_turniej_nie_ma_jawnej"),
    STAGE_BASKET_QUALIFICATION_FORMAT_NOT_SUPPORTED: t("stageLifecycleFeedback.ten_format_etapu_nie_obsluguje"),
    STAGE_BASKET_QUALIFICATION_PROPOSAL_STALE: t("stageLifecycleFeedback.wyniki_lub_konfiguracja_zmienily_sie"),
    STAGE_BASKET_QUALIFICATION_ALREADY_APPROVED: t("stageLifecycleFeedback.kwalifikacja_zostala_juz_zatwierdzona_sp"),
    STAGE_BASKET_QUALIFICATION_STAGE_INCOMPLETE: t("stageLifecycleFeedback.najpierw_zakoncz_etap_zrodlowy_potem"),
    STAGE_BASKET_TIE_BREAK_REQUIRED: t("stageLifecycleFeedback.remis_wymaga_rozstrzygniecia_przed_przyg"),
    STAGE_BASKET_ROUTE_SOURCE_NOT_APPROVED: t("stageLifecycleFeedback.najpierw_zatwierdz_kwalifikacje_etapu_zr"),
    STAGE_BASKET_ROUTE_SOURCE_STAGE_NOT_COMPLETED: t("stageLifecycleFeedback.najpierw_zakoncz_etap_zrodlowy_potem_2"),
    STAGE_BASKET_ROUTE_SOURCE_OUTPUT_INCOMPLETE: t("stageLifecycleFeedback.sklad_koszyka_wyjsciowego_jest_niekomple"),
    STAGE_BASKET_ROUTE_TARGET_STAGE_ALREADY_STARTED: t("stageLifecycleFeedback.etap_docelowy_juz_sie_rozpoczal"),
    STAGE_BASKET_ROUTE_PARTICIPANT_CONFLICT: t("stageLifecycleFeedback.uczestnik_jest_juz_przypisany_do"),
    STAGE_BASKET_ROUTE_LEGACY_NOT_SUPPORTED: t("stageLifecycleFeedback.ten_turniej_nie_ma_konfiguracji"),
    RANKING_INCONSISTENT: t("stageLifecycleFeedback.nie_mozna_potwierdzic_rankingu_etapu"),
  };
  const known = code && Object.prototype.hasOwnProperty.call(qualificationMessages, code)
    ? qualificationMessages[code] : undefined;
  const hasServerDetail = typeof response?.data?.error === "string" && !!response.data.error.trim();
  const fallback = t("stageLifecycleFeedback.nie_udalo_sie_potwierdzic_operacji");
  const message = known ?? (code || hasServerDetail
    ? (!detail || /^[A-Z_\d]+$/.test(detail) ? t("stageLifecycleFeedback.stan_etapu_nie_pozwala_na") : detail)
    : fallback);
  return `${message}${code ? t("stageLifecycleFeedback.kod_diagnostyczny_code", { code: code }) : ""}`;
}
