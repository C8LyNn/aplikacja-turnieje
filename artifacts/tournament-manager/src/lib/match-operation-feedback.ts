import { getApiErrorMessage } from "./tournament-stages-ui";

export function matchOperationError(error: unknown) {
  const response = error as { status?: number; data?: { code?: unknown; error?: unknown } } | null;
  const code = typeof response?.data?.code === "string" ? response.data.code : undefined;
  // V5.6: a status change refused because another operator already finished or cancelled the match is a conflict
  // too — the page refreshes so the operator sees the current state.
  const conflict = response?.status === 409 || code === "FINALIZED_MATCH_PATCH_FORBIDDEN" || code === "CANCELLED_MATCH_PATCH_FORBIDDEN";
  const messages: Record<string, string> = {
    MATCH_ALREADY_FINALIZED: "Ten mecz ma już zapisany wynik, być może w innym oknie. Sprawdź aktualny wynik przed korektą.",
    MATCH_NOT_COMPLETED: "Wynik tego meczu został już cofnięty lub nie był jeszcze zapisany.",
    CONCURRENT_MODIFICATION: "Mecz zmienił się od czasu rozpoczęcia edycji. Sprawdź aktualnych zawodników i wynik przed ponownym zapisem.",
    DOWNSTREAM_BLOCKED: "Nie można cofnąć wyniku, ponieważ zależne mecze lub kolejna runda już się rozpoczęły.",
    STAGE_ALREADY_ADVANCED: "Nie można cofnąć wyniku po uruchomieniu kolejnego etapu.",
    STAGE_QUALIFICATION_ALREADY_COMMITTED: "Nie można cofnąć wyniku po zatwierdzeniu kwalifikacji lub wykonaniu routingu etapu.",
    FINALIZED_MATCH_PATCH_FORBIDDEN: "Ten mecz ma już zapisany wynik, być może z innego okna. Stan meczu został odświeżony — sprawdź wynik.",
    CANCELLED_MATCH_PATCH_FORBIDDEN: "Ten mecz został w międzyczasie anulowany. Stan meczu został odświeżony; przywróć go, jeśli ma się odbyć.",
    BEST_OF_CHANGE_NOT_ALLOWED: "Długość meczu można zmienić tylko przed jego rozpoczęciem.",
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
