import { t } from "@/i18n";
/**
 * QW-10 · empty lists say why they are empty and what comes next, the same way in Classic and Modern.
 * Texts only: no new actions, nothing that changes the tournament.
 */
export interface EmptyStateContext {
  status: string | null | undefined;
  playerCount: number;
  /** Organizer or support who runs the tournament (sees the next step); viewers get a neutral sentence. */
  canManage: boolean;
}

export interface EmptyState {
  text: string;
  /** Detail tab with the next step, for people who can take it. */
  tab?: { value: string; label: string };
}

export function matchesEmptyState({ status, playerCount, canManage }: EmptyStateContext): EmptyState {
  if (status === "draft") {
    if (!canManage) return { text: t("organizerEmptyStates.mecze_pojawia_sie_po_rozpoczeciu") };
    return playerCount < 2
      ? { text: t("organizerEmptyStates.mecze_pojawia_sie_po_rozpoczeciu_2"), tab: { value: "players", label: t("organizerEmptyStates.przejdz_do_uczestnikow") } }
      : { text: t("organizerEmptyStates.mecze_pojawia_sie_po_rozpoczeciu_3"), tab: { value: "stages", label: t("organizerEmptyStates.przejdz_do_etapow") } };
  }
  if (status === "completed") return { text: t("organizerEmptyStates.ten_turniej_nie_ma_meczow") };
  return canManage
    ? { text: t("organizerEmptyStates.biezacy_etap_nie_ma_jeszcze"), tab: { value: "stages", label: t("organizerEmptyStates.przejdz_do_etapow") } }
    : { text: t("organizerEmptyStates.mecze_tego_etapu_nie_zostaly") };
}

export function standingsEmptyText(status: string | null | undefined): string {
  return status === "draft"
    ? t("organizerEmptyStates.tabela_pojawi_sie_po_rozpoczeciu")
    : t("organizerEmptyStates.tabela_pojawi_sie_po_pierwszym");
}

export function historyEmptyText(canWriteResults: boolean): string {
  return canWriteResults
    ? t("organizerEmptyStates.tu_pojawia_sie_zapisane_wyniki")
    : t("organizerEmptyStates.nie_ma_jeszcze_zapisanych_wynikow");
}

export function queueEmptyText(input: { status: string | null | undefined; filtered: boolean }): string {
  if (input.filtered) return t("organizerEmptyStates.brak_meczow_w_tym_stanie");
  if (input.status === "completed") return t("organizerEmptyStates.wszystkie_mecze_rozegrane_turniej_jest");
  return t("organizerEmptyStates.brak_meczow_do_rozegrania_nastepny");
}
