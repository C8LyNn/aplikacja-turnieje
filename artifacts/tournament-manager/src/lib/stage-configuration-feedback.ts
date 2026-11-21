import { t } from "@/i18n";
import type { StageBasket, StageBasketRoute, StageBasketProblemContext, TournamentStage } from "@workspace/api-client-react";

export interface ConfigurationProblem {
  code: string;
  message: string;
  context?: StageBasketProblemContext & { expected?: number; actual?: number };
  expected?: number;
  actual?: number;
}

export interface ConfigurationContext {
  stages?: Pick<TournamentStage, "id" | "name">[];
  baskets?: Pick<StageBasket, "id" | "stageId">[];
  routes?: Pick<StageBasketRoute, "id" | "sourceBasketId" | "targetBasketId">[];
  stageId?: number;
}

const PROBLEM_CODE_MESSAGES: Record<string, string> = {
  get STAGE_BASKET_STAGE_NOT_FOUND() { return t("stageConfigurationFeedback.etap_powiazany_z_koszykiem_nie"); },
  get STAGE_BASKET_ID_INVALID() { return t("stageConfigurationFeedback.id_koszyka_jest_nieprawidlowe"); },
  get STAGE_BASKET_ID_DUPLICATE() { return t("stageConfigurationFeedback.zduplikowane_id_koszyka"); },
  get STAGE_INPUT_BASKET_COUNT_INVALID() { return t("stageConfigurationFeedback.nieprawidlowa_liczba_koszykow_wejsciowyc"); },
  get STAGE_OUTPUT_BASKET_COUNT_INVALID() { return t("stageConfigurationFeedback.nieprawidlowa_liczba_koszykow_wyjsciowyc"); },
  get STAGE_BASKET_ORDINAL_DUPLICATE() { return t("stageConfigurationFeedback.zduplikowany_numer_koszyka_usun_jeden"); },
  get STAGE_BASKET_ORDINAL_INVALID() { return t("stageConfigurationFeedback.numer_koszyka_ordinal_poza_zakresem"); },
  get STAGE_BASKET_ORDER_DUPLICATE() { return t("stageConfigurationFeedback.zduplikowana_kolejnosc_wyswietlania_kosz"); },
  get STAGE_BASKET_ORDER_INVALID() { return t("stageConfigurationFeedback.kolejnosc_koszyka_poza_zakresem_1"); },
  get STAGE_BASKET_COLOR_ID_INVALID() { return t("stageConfigurationFeedback.nieprawidlowy_identyfikator_koloru_koszy"); },
  get STAGE_BASKET_PARTICIPANT_NOT_FOUND() { return t("stageConfigurationFeedback.uczestnik_przypisany_do_koszyka_nie"); },
  get STAGE_OUTPUT_BASKET_PARTICIPANTS_NOT_ALLOWED() { return t("stageConfigurationFeedback.do_koszykow_wyjsciowych_nie_mozna"); },
  get STAGE_BASKET_PARTICIPANT_DUPLICATE() { return t("stageConfigurationFeedback.uczestnik_jest_przypisany_do_wiecej"); },
  get STAGE_BASKET_ROUTE_ID_INVALID() { return t("stageConfigurationFeedback.id_polaczenia_jest_nieprawidlowe"); },
  get STAGE_BASKET_ROUTE_ID_DUPLICATE() { return t("stageConfigurationFeedback.zduplikowane_id_polaczenia"); },
  get STAGE_BASKET_ROUTE_SOURCE_NOT_FOUND() { return t("stageConfigurationFeedback.zrodlowy_koszyk_polaczenia_nie_istnieje"); },
  get STAGE_BASKET_ROUTE_TARGET_NOT_FOUND() { return t("stageConfigurationFeedback.docelowy_koszyk_polaczenia_nie_istnieje"); },
  get STAGE_BASKET_ROUTE_SOURCE_NOT_OUTPUT() { return t("stageConfigurationFeedback.zrodlo_polaczenia_musi_byc_koszykiem"); },
  get STAGE_BASKET_ROUTE_TARGET_NOT_INPUT() { return t("stageConfigurationFeedback.cel_polaczenia_musi_byc_koszykiem"); },
  get STAGE_BASKET_ROUTE_OUTPUT_REUSED() { return t("stageConfigurationFeedback.koszyk_wyjsciowy_ma_juz_przypisane"); },
  get STAGE_BASKET_ROUTE_NOT_FORWARD() { return t("stageConfigurationFeedback.polaczenia_moga_prowadzic_wylacznie_do"); },
  get STAGE_BASKET_ROUTE_CYCLE() { return t("stageConfigurationFeedback.konfiguracja_polaczen_tworzy_cykl"); },
  get STAGE_INPUT_BASKET_QUALIFIER_COUNT_NOT_ALLOWED() { return t("stageConfigurationFeedback.koszyki_wejsciowe_nie_moga_miec"); },
  get STAGE_OUTPUT_BASKET_QUALIFIER_COUNT_REQUIRED() { return t("stageConfigurationFeedback.kazdy_koszyk_wyjsciowy_musi_miec"); },
  get STAGE_OUTPUT_BASKET_QUALIFIER_COUNT_INVALID() { return t("stageConfigurationFeedback.liczba_przechodzacych_graczy_musi_byc"); },
  get STAGE_OUTPUT_BASKET_QUOTA_EXCEEDS_PARTICIPANT_COUNT() { return t("stageConfigurationFeedback.suma_przechodzacych_graczy_przekracza_li"); },
  get STAGE_DERIVED_PARTICIPANT_COUNT_INVALID() { return t("stageConfigurationFeedback.etap_musi_miec_co_najmniej"); },
};

const CONFIG_ERROR_MESSAGES: Record<string, string> = {
  get TOURNAMENT_NOT_FOUND() { return t("stageConfigurationFeedback.turniej_nie_zostal_znaleziony"); },
  get STAGE_BASKET_CONFIGURATION_IMMUTABLE() { return t("stageConfigurationFeedback.konfiguracja_koszykow_jest_zablokowana_t"); },
  get STAGE_BASKET_CONFIGURATION_INVALID() { return t("stageConfigurationFeedback.konfiguracja_koszykow_zawiera_bledy_spra"); },
  get STAGE_BASKET_ID_REASSIGNED() { return t("stageConfigurationFeedback.id_koszyka_zostalo_ponownie_uzyte"); },
};

const connectionError = () => t("stageConfigurationFeedback.nie_udalo_sie_polaczyc_z");

/** An API error payload is untrusted at runtime, regardless of generated TS types. */
function isConfigurationProblem(value: unknown): value is ConfigurationProblem {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.code === "string" && candidate.code.length > 0 &&
    typeof candidate.message === "string";
}

export function configurationProblemMessage(problem: ConfigurationProblem, context: ConfigurationContext = {}): string {
  if (!problem.code) return problem.message;
  const detail = problem.context ?? {};
  const route = context.routes?.find(entry => entry.id === detail.routeId);
  const basket = context.baskets?.find(entry => entry.id === (detail.basketId ?? route?.targetBasketId));
  const stageIds = [...new Set([detail.stageId, detail.sourceStageId, detail.targetStageId, basket?.stageId].filter((id): id is number => typeof id === "number"))];
  if (!stageIds.length && context.stageId != null) stageIds.push(context.stageId);
  const names = stageIds.map(id => context.stages?.find(stage => stage.id === id)?.name ?? t("stageConfigurationFeedback.etap_id", { id: id })).join(" → ");
  const expected = problem.expected ?? detail.expected;
  const actual = problem.actual ?? detail.actual;
  let message = Object.hasOwn(PROBLEM_CODE_MESSAGES, problem.code)
    ? PROBLEM_CODE_MESSAGES[problem.code] : problem.message;
  let instruction = t("stageConfigurationFeedback.sprawdz_wskazany_koszyk_i_popraw");
  if (problem.code === "STAGE_PARTICIPANTS_INCONSISTENT") {
    message = typeof expected === "number" && typeof actual === "number" && expected !== actual
      ? t("stageConfigurationFeedback.oczekiwana_liczba_uczestnikow_expected_d", { expected: expected, actual: actual })
      : problem.message;
    instruction = t("stageConfigurationFeedback.sprawdz_przypisania_uczestnikow_oraz_lic");
  } else if (problem.code.startsWith("STAGE_BASKET_ROUTE_")) {
    instruction = t("stageConfigurationFeedback.popraw_polaczenie_wybierz_istniejacy_kos");
  } else if (problem.code === "STAGE_BASKET_PARTICIPANT_NOT_FOUND" || problem.code === "STAGE_BASKET_PARTICIPANT_DUPLICATE" || problem.code === "STAGE_DERIVED_PARTICIPANT_COUNT_INVALID") {
    instruction = t("stageConfigurationFeedback.sprawdz_liste_zawodnikow_i_popraw");
  } else if (problem.code.includes("QUALIFIER_COUNT") || problem.code === "STAGE_OUTPUT_BASKET_QUOTA_EXCEEDS_PARTICIPANT_COUNT") {
    instruction = t("stageConfigurationFeedback.popraw_liczbe_przechodzacych_uczestnikow");
  }
  // Some existing responses include counts only in the message. Do not discard them.
  const serverDetail = message !== problem.message && /\d/.test(problem.message) ? t("stageConfigurationFeedback.szczegoly_message", { message: problem.message }) : "";
  const counts = !(problem.code === "STAGE_PARTICIPANTS_INCONSISTENT" && typeof expected === "number" && typeof actual === "number" && expected !== actual) && (typeof expected === "number" || typeof actual === "number")
    ? t("stageConfigurationFeedback.oczekiwano_v0_otrzymano_v1", { v0: expected ?? "—", v1: actual ?? "—" }) : "";
  const participant = typeof detail.participantId === "number" ? t("stageConfigurationFeedback.uczestnik_participantid", { participantId: detail.participantId }) : "";
  return `${names ? `${names}: ` : ""}${message}${counts}${participant} ${instruction}${serverDetail}`;
}

export function configurationErrorFeedback(error: unknown): { message: string; problems: ConfigurationProblem[] } {
  const response = error as { status?: number; data?: {
    code?: unknown; error?: unknown; message?: unknown; problems?: unknown; details?: unknown;
  } } | null;
  if (!response?.status || response.status >= 500) return { message: connectionError(), problems: [] };
  const data = response.data;
  const details = data?.details;
  const detailObject = details !== null && typeof details === "object" && !Array.isArray(details)
    ? details as Record<string, unknown> : undefined;
  const candidates = Array.isArray(data?.problems) ? data.problems
    : Array.isArray(details) ? details
    : detailObject?.problems;
  const problems: ConfigurationProblem[] = Array.isArray(candidates)
    ? candidates.filter(isConfigurationProblem) : [];
  const code = typeof data?.code === "string" ? data.code : undefined;
  const serverError = typeof data?.error === "string" && data.error.trim() ? data.error : undefined;
  const serverMessage = typeof data?.message === "string" && data.message.trim() ? data.message : undefined;
  if (!problems.length && code && detailObject) {
    problems.push({
      code,
      message: serverError ?? serverMessage ?? code,
      context: detailObject as ConfigurationProblem["context"],
    });
  }
  const knownCodeMessage = code && Object.hasOwn(CONFIG_ERROR_MESSAGES, code)
    ? CONFIG_ERROR_MESSAGES[code] : undefined;
  return {
    message: serverError ?? serverMessage ?? knownCodeMessage ?? code ??
      t("stageConfigurationFeedback.nie_mozna_zapisac_konfiguracji_sprawdz"),
    problems,
  };
}
