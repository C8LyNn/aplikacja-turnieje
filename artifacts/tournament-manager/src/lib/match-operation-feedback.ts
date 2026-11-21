import { t } from "@/i18n";
import { getApiErrorMessage } from "./tournament-stages-ui";

export function matchOperationError(error: unknown) {
  const response = error as { status?: number; data?: { code?: unknown; error?: unknown } } | null;
  const code = typeof response?.data?.code === "string" ? response.data.code : undefined;
  // V5.6: a status change refused because another operator already finished or cancelled the match is a conflict
  // too — the page refreshes so the operator sees the current state.
  const conflict = response?.status === 409 || code === "FINALIZED_MATCH_PATCH_FORBIDDEN" || code === "CANCELLED_MATCH_PATCH_FORBIDDEN";
  const messages: Record<string, string> = {
    MATCH_ALREADY_FINALIZED: t("matchOperationFeedback.ten_mecz_ma_juz_zapisany"),
    MATCH_NOT_COMPLETED: t("matchOperationFeedback.wynik_tego_meczu_zostal_juz"),
    CONCURRENT_MODIFICATION: t("matchOperationFeedback.mecz_zmienil_sie_od_czasu"),
    DOWNSTREAM_BLOCKED: t("matchOperationFeedback.nie_mozna_cofnac_wyniku_poniewaz"),
    STAGE_ALREADY_ADVANCED: t("matchOperationFeedback.nie_mozna_cofnac_wyniku_po"),
    STAGE_QUALIFICATION_ALREADY_COMMITTED: t("matchOperationFeedback.nie_mozna_cofnac_wyniku_po_2"),
    FINALIZED_MATCH_PATCH_FORBIDDEN: t("matchOperationFeedback.ten_mecz_ma_juz_zapisany_2"),
    CANCELLED_MATCH_PATCH_FORBIDDEN: t("matchOperationFeedback.ten_mecz_zostal_w_miedzyczasie"),
    BEST_OF_CHANGE_NOT_ALLOWED: t("matchOperationFeedback.dlugosc_meczu_mozna_zmienic_tylko"),
  };
  const rawDetail = getApiErrorMessage(error);
  const detail = typeof rawDetail === "string" ? rawDetail : "";
  const serverError = typeof response?.data?.error === "string" ? response.data.error : undefined;
  // Do not read inherited properties such as "constructor" or "toString" as diagnostic messages.
  // V5.7: for blocked reverts the server names the exact match or stage — prefer its message.
  const serverNamesBlocker = !!code && ["DOWNSTREAM_BLOCKED", "STAGE_ALREADY_ADVANCED", "STAGE_QUALIFICATION_ALREADY_COMMITTED"].includes(code)
    && !!serverError && serverError.trim().length > 0 && !/^[A-Z_\d]+$/.test(serverError);
  const knownMessage = code && !serverNamesBlocker && Object.prototype.hasOwnProperty.call(messages, code)
    ? messages[code]
    : undefined;
  // V5.6: an expired or missing session is said in plain words, never as the server's English status text.
  const sessionMessage = response?.status === 401 || response?.status === 403
    ? t("matchOperationFeedback.sesja_wygasla_albo_nie_masz")
    : undefined;
  const message = knownMessage || sessionMessage || (serverError && detail.trim() && !/^[A-Z_\d]+$/.test(detail) ? detail
    : conflict ? t("matchOperationFeedback.stan_meczu_nie_pozwala_na")
    : t("matchOperationFeedback.nie_udalo_sie_potwierdzic_zapisu"));
  return { message, code, conflict };
}

export const MATCH_STATUS_LABELS: Record<string, string> = {
  get pending() { return t("matchOperationFeedback.oczekuje"); }, in_progress: "LIVE", get completed() { return t("matchOperationFeedback.zakonczony"); },
  get postponed() { return t("matchOperationFeedback.przelozony"); }, get cancelled() { return t("matchOperationFeedback.anulowany"); },
};
