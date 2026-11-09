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
  STAGE_BASKET_STAGE_NOT_FOUND:              "Etap powiązany z koszykiem nie istnieje.",
  STAGE_BASKET_ID_INVALID:                   "ID koszyka jest nieprawidłowe.",
  STAGE_BASKET_ID_DUPLICATE:                 "Zduplikowane ID koszyka.",
  STAGE_INPUT_BASKET_COUNT_INVALID:          "Nieprawidłowa liczba koszyków wejściowych (wymagany min. 1, max. 4).",
  STAGE_OUTPUT_BASKET_COUNT_INVALID:         "Nieprawidłowa liczba koszyków wyjściowych (wymagany min. 1, max. 4).",
  STAGE_BASKET_ORDINAL_DUPLICATE:            "Zduplikowany numer koszyka. Usuń jeden z kolidujących koszyków i spróbuj ponownie.",
  STAGE_BASKET_ORDINAL_INVALID:              "Numer koszyka (ordinal) poza zakresem 1–4.",
  STAGE_BASKET_ORDER_DUPLICATE:              "Zduplikowana kolejność wyświetlania koszyka.",
  STAGE_BASKET_ORDER_INVALID:                "Kolejność koszyka poza zakresem 1–4.",
  STAGE_BASKET_COLOR_ID_INVALID:             "Nieprawidłowy identyfikator koloru koszyka.",
  STAGE_BASKET_PARTICIPANT_NOT_FOUND:        "Uczestnik przypisany do koszyka nie istnieje w turnieju.",
  STAGE_OUTPUT_BASKET_PARTICIPANTS_NOT_ALLOWED: "Do koszyków wyjściowych nie można przypisywać uczestników.",
  STAGE_BASKET_PARTICIPANT_DUPLICATE:        "Uczestnik jest przypisany do więcej niż jednego koszyka lub etapu.",
  STAGE_BASKET_ROUTE_ID_INVALID:             "ID połączenia jest nieprawidłowe.",
  STAGE_BASKET_ROUTE_ID_DUPLICATE:           "Zduplikowane ID połączenia.",
  STAGE_BASKET_ROUTE_SOURCE_NOT_FOUND:       "Źródłowy koszyk połączenia nie istnieje.",
  STAGE_BASKET_ROUTE_TARGET_NOT_FOUND:       "Docelowy koszyk połączenia nie istnieje.",
  STAGE_BASKET_ROUTE_SOURCE_NOT_OUTPUT:      "Źródło połączenia musi być koszykiem wyjściowym.",
  STAGE_BASKET_ROUTE_TARGET_NOT_INPUT:       "Cel połączenia musi być koszykiem wejściowym.",
  STAGE_BASKET_ROUTE_OUTPUT_REUSED:          "Koszyk wyjściowy ma już przypisane połączenie — każde wyjście może mieć tylko jedną trasę.",
  STAGE_BASKET_ROUTE_NOT_FORWARD:            "Połączenia mogą prowadzić wyłącznie do późniejszych etapów.",
  STAGE_BASKET_ROUTE_CYCLE:                  "Konfiguracja połączeń tworzy cykl.",
  STAGE_INPUT_BASKET_QUALIFIER_COUNT_NOT_ALLOWED:       "Koszyki wejściowe nie mogą mieć ustawionej liczby kwalifikujących graczy.",
  STAGE_OUTPUT_BASKET_QUALIFIER_COUNT_REQUIRED:         "Każdy koszyk wyjściowy musi mieć ustawioną liczbę przechodzących graczy.",
  STAGE_OUTPUT_BASKET_QUALIFIER_COUNT_INVALID:          "Liczba przechodzących graczy musi być dodatnią liczbą całkowitą.",
  STAGE_OUTPUT_BASKET_QUOTA_EXCEEDS_PARTICIPANT_COUNT:  "Suma przechodzących graczy przekracza liczbę uczestników etapu.",
  STAGE_DERIVED_PARTICIPANT_COUNT_INVALID:              "Etap musi mieć co najmniej dwóch uczestników wynikających z wejść i tras.",
};

const CONFIG_ERROR_MESSAGES: Record<string, string> = {
  TOURNAMENT_NOT_FOUND:                "Turniej nie został znaleziony.",
  STAGE_BASKET_CONFIGURATION_IMMUTABLE: "Konfiguracja koszyków jest zablokowana — turniej już się rozpoczął.",
  STAGE_BASKET_CONFIGURATION_INVALID:  "Konfiguracja koszyków zawiera błędy. Sprawdź szczegóły poniżej.",
  STAGE_BASKET_ID_REASSIGNED:          "ID koszyka zostało ponownie użyte po wcześniejszym usunięciu. Odśwież stronę i spróbuj ponownie.",
};

const CONNECTION_ERROR = "Nie udało się połączyć z serwerem. Spróbuj ponownie.";

export function configurationProblemMessage(problem: ConfigurationProblem, context: ConfigurationContext = {}): string {
  if (!problem.code) return problem.message;
  const detail = problem.context ?? {};
  const route = context.routes?.find(entry => entry.id === detail.routeId);
  const basket = context.baskets?.find(entry => entry.id === (detail.basketId ?? route?.targetBasketId));
  const stageIds = [...new Set([detail.stageId, detail.sourceStageId, detail.targetStageId, basket?.stageId].filter((id): id is number => typeof id === "number"))];
  if (!stageIds.length && context.stageId != null) stageIds.push(context.stageId);
  const names = stageIds.map(id => context.stages?.find(stage => stage.id === id)?.name ?? `Etap ${id}`).join(" → ");
  const expected = problem.expected ?? detail.expected;
  const actual = problem.actual ?? detail.actual;
  let message = PROBLEM_CODE_MESSAGES[problem.code] ?? problem.message;
  let instruction = "Sprawdź wskazany koszyk i popraw jego konfigurację.";
  if (problem.code === "STAGE_PARTICIPANTS_INCONSISTENT") {
    message = typeof expected === "number" && typeof actual === "number" && expected !== actual
      ? `Oczekiwana liczba uczestników: ${expected}; dostępni uczestnicy: ${actual}.`
      : problem.message;
    instruction = "Sprawdź przypisania uczestników oraz liczbę przechodzących i wykonanie przekazania z poprzedniego etapu.";
  } else if (problem.code.startsWith("STAGE_BASKET_ROUTE_")) {
    instruction = "Popraw połączenie: wybierz istniejący koszyk wyjściowy i koszyk wejściowy późniejszego etapu.";
  } else if (problem.code === "STAGE_BASKET_PARTICIPANT_NOT_FOUND" || problem.code === "STAGE_BASKET_PARTICIPANT_DUPLICATE" || problem.code === "STAGE_DERIVED_PARTICIPANT_COUNT_INVALID") {
    instruction = "Sprawdź listę zawodników i popraw przypisania do koszyków wejściowych.";
  } else if (problem.code.includes("QUALIFIER_COUNT") || problem.code === "STAGE_OUTPUT_BASKET_QUOTA_EXCEEDS_PARTICIPANT_COUNT") {
    instruction = "Popraw liczbę przechodzących uczestników w koszykach wyjściowych wskazanego etapu.";
  }
  // Some existing responses include counts only in the message. Do not discard them.
  const serverDetail = message !== problem.message && /\d/.test(problem.message) ? ` Szczegóły: ${problem.message}` : "";
  const counts = !(problem.code === "STAGE_PARTICIPANTS_INCONSISTENT" && typeof expected === "number" && typeof actual === "number" && expected !== actual) && (typeof expected === "number" || typeof actual === "number")
    ? ` Oczekiwano: ${expected ?? "—"}; otrzymano: ${actual ?? "—"}.` : "";
  const participant = typeof detail.participantId === "number" ? ` Uczestnik #${detail.participantId}.` : "";
  return `${names ? `${names}: ` : ""}${message}${counts}${participant} ${instruction}${serverDetail}`;
}

export function configurationErrorFeedback(error: unknown): { message: string; problems: ConfigurationProblem[] } {
  const response = error as { status?: number; data?: { code?: string; error?: string; message?: string; problems?: ConfigurationProblem[]; details?: ConfigurationProblem[] | (ConfigurationProblem["context"] & { problems?: ConfigurationProblem[] }) } } | null;
  if (!response?.status || response.status >= 500) return { message: CONNECTION_ERROR, problems: [] };
  const data = response.data;
  const problems = [...(data?.problems ?? (Array.isArray(data?.details) ? data.details : data?.details?.problems) ?? [])];
  if (!problems.length && data?.code && data.details && !Array.isArray(data.details)) {
    problems.push({ code: data.code, message: data.error ?? data.message ?? data.code, context: data.details });
  }
  return {
    message: data?.error || data?.message || (data?.code && CONFIG_ERROR_MESSAGES[data.code]) || data?.code || "Nie można zapisać konfiguracji. Sprawdź wprowadzone dane.",
    problems,
  };
}
