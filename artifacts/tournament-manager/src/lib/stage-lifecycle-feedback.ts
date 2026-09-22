import type { StageStartReadiness } from "@workspace/api-client-react";
import { getApiErrorMessage } from "./tournament-stages-ui";
import { configurationProblemMessage, type ConfigurationContext } from "./stage-configuration-feedback";

export function stageReadinessMessages(readiness: StageStartReadiness, context: ConfigurationContext = {}): string[] {
  if (readiness.ready) return [];
  return [...new Set([
    readiness.reasonCode === "STAGE_PARTICIPANTS_INCONSISTENT"
      ? configurationProblemMessage({ code: readiness.reasonCode, message: readiness.message, expected: readiness.requiredParticipantCount, actual: readiness.participantCount }, context)
      : readiness.message,
    ...(readiness.missingSeeds.length ? [`Brakujące seedy: ${readiness.missingSeeds.join(", ")}.`] : []),
    ...readiness.basketValidation.problems.map(problem => configurationProblemMessage(problem, context)),
  ].filter(Boolean))];
}

export function stageLifecycleError(error: unknown): string {
  const response = error as { status?: number; data?: { code?: string; error?: string } };
  const detail = getApiErrorMessage(error);
  const qualificationMessages: Record<string, string> = {
    STAGE_BASKET_CONFIGURATION_NOT_EXPLICIT: "Ten turniej nie ma jawnej konfiguracji koszyków wymaganej do qualification/routingu.",
    STAGE_BASKET_QUALIFICATION_FORMAT_NOT_SUPPORTED: "Ten format etapu nie obsługuje qualification przez koszyki.",
    STAGE_BASKET_QUALIFICATION_PROPOSAL_STALE: "Wyniki lub konfiguracja zmieniły się. Odśwież propozycję z wyników i sprawdź skład przed zatwierdzeniem.",
    STAGE_BASKET_QUALIFICATION_ALREADY_APPROVED: "Kwalifikacja została już zatwierdzona. Sprawdź aktualny stan routingu.",
    STAGE_BASKET_QUALIFICATION_STAGE_INCOMPLETE: "Najpierw zakończ etap źródłowy, potem zatwierdź kwalifikację.",
    STAGE_BASKET_TIE_BREAK_REQUIRED: "Remis wymaga rozstrzygnięcia przed przygotowaniem kwalifikacji. Sprawdź wyniki etapu.",
    STAGE_BASKET_ROUTE_SOURCE_NOT_APPROVED: "Najpierw zatwierdź kwalifikację etapu źródłowego.",
    STAGE_BASKET_ROUTE_SOURCE_STAGE_NOT_COMPLETED: "Najpierw zakończ etap źródłowy, potem wykonaj routing.",
    STAGE_BASKET_ROUTE_SOURCE_OUTPUT_INCOMPLETE: "Skład koszyka wyjściowego jest niekompletny. Sprawdź kwalifikację.",
    STAGE_BASKET_ROUTE_TARGET_STAGE_ALREADY_STARTED: "Etap docelowy już się rozpoczął. Nie można przekazać do niego uczestników.",
    STAGE_BASKET_ROUTE_PARTICIPANT_CONFLICT: "Uczestnik jest już przypisany do etapu docelowego. Sprawdź skład i przepływ w Koszykach.",
    STAGE_BASKET_ROUTE_LEGACY_NOT_SUPPORTED: "Ten turniej nie ma konfiguracji routingu obsługiwanej przez ten panel.",
    RANKING_INCONSISTENT: "Nie można potwierdzić rankingu etapu. Odśwież wyniki i sprawdź kompletność danych.",
  };
  const message = qualificationMessages[response?.data?.code ?? ""] ?? (response?.data?.code || response?.data?.error
    ? (/^[A-Z_\d]+$/.test(detail) ? "Stan etapu nie pozwala na tę operację. Sprawdź warunki gotowości." : detail)
    : "Nie udało się potwierdzić operacji. Sprawdź połączenie i aktualny stan etapu przed ponowieniem.");
  return `${message}${response?.data?.code ? ` Kod diagnostyczny: ${response.data.code}` : ""}`;
}
