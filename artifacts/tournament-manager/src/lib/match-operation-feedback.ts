import { getApiErrorMessage } from "./tournament-stages-ui";

export function matchOperationError(error: unknown) {
  const response = error as { status?: number; data?: { code?: unknown; error?: unknown } } | null;
  const code = typeof response?.data?.code === "string" ? response.data.code : undefined;
  const conflict = response?.status === 409;
  const messages: Record<string, string> = {
    MATCH_ALREADY_FINALIZED: "Ten mecz ma już zapisany wynik, być może w innym oknie. Sprawdź aktualny wynik przed korektą.",
    MATCH_NOT_COMPLETED: "Wynik tego meczu został już cofnięty lub nie był jeszcze zapisany.",
    CONCURRENT_MODIFICATION: "Mecz zmienił się od czasu rozpoczęcia edycji. Sprawdź aktualnych zawodników i wynik przed ponownym zapisem.",
    DOWNSTREAM_BLOCKED: "Nie można cofnąć wyniku, ponieważ zależne mecze lub kolejna runda już się rozpoczęły.",
    STAGE_ALREADY_ADVANCED: "Nie można cofnąć wyniku po uruchomieniu kolejnego etapu.",
    STAGE_QUALIFICATION_ALREADY_COMMITTED: "Nie można cofnąć wyniku po zatwierdzeniu kwalifikacji lub wykonaniu routingu etapu.",
  };
  const rawDetail = getApiErrorMessage(error);
  const detail = typeof rawDetail === "string" ? rawDetail : "";
  const serverError = typeof response?.data?.error === "string" ? response.data.error : undefined;
  // Do not read inherited properties such as "constructor" or "toString" as diagnostic messages.
  const knownMessage = code && Object.prototype.hasOwnProperty.call(messages, code)
    ? messages[code]
    : undefined;
  const message = knownMessage || (serverError && detail.trim() && !/^[A-Z_\d]+$/.test(detail) ? detail
    : conflict ? "Stan meczu nie pozwala na tę operację. Sprawdź aktualne dane przed ponowieniem."
    : "Nie udało się potwierdzić zapisu. Sprawdź połączenie i aktualny stan przed ponowieniem. Wpisany wynik pozostaje w formularzu.");
  return { message, code, conflict };
}

export const MATCH_STATUS_LABELS: Record<string, string> = {
  pending: "Oczekuje", in_progress: "LIVE", completed: "Zakończony",
  postponed: "Przełożony", cancelled: "Anulowany",
};
