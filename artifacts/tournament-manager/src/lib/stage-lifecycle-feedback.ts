import type { StageStartReadiness } from "@workspace/api-client-react";
import { getApiErrorMessage } from "./tournament-stages-ui";

export function stageReadinessMessages(readiness: StageStartReadiness): string[] {
  if (readiness.ready) return [];
  return [...new Set([
    readiness.message,
    ...(readiness.missingSeeds.length ? [`Brakujące seedy: ${readiness.missingSeeds.join(", ")}.`] : []),
    ...readiness.basketValidation.problems.map(problem => problem.message),
  ].filter(Boolean))];
}

export function stageLifecycleError(error: unknown): string {
  const response = error as { status?: number; data?: { code?: string; error?: string } };
  const detail = getApiErrorMessage(error);
  const message = response?.data?.code || response?.data?.error
    ? (/^[A-Z_\d]+$/.test(detail) ? "Stan etapu nie pozwala na tę operację. Sprawdź warunki gotowości." : detail)
    : "Nie udało się potwierdzić operacji. Sprawdź połączenie i aktualny stan etapu przed ponowieniem.";
  return `${message}${response?.data?.code ? ` Kod diagnostyczny: ${response.data.code}` : ""}`;
}
