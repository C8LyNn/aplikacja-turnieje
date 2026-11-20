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
    if (!canManage) return { text: "Mecze pojawią się po rozpoczęciu turnieju." };
    return playerCount < 2
      ? { text: "Mecze pojawią się po rozpoczęciu turnieju. Najpierw dodaj co najmniej dwóch uczestników.", tab: { value: "players", label: "Przejdź do uczestników" } }
      : { text: "Mecze pojawią się po rozpoczęciu pierwszego etapu.", tab: { value: "stages", label: "Przejdź do etapów" } };
  }
  if (status === "completed") return { text: "Ten turniej nie ma meczów." };
  return canManage
    ? { text: "Bieżący etap nie ma jeszcze meczów — następny krok podpowiada „Co teraz?” w panelu prowadzącego.", tab: { value: "stages", label: "Przejdź do etapów" } }
    : { text: "Mecze tego etapu nie zostały jeszcze rozlosowane." };
}

export function standingsEmptyText(status: string | null | undefined): string {
  return status === "draft"
    ? "Tabela pojawi się po rozpoczęciu turnieju i pierwszych wynikach."
    : "Tabela pojawi się po pierwszym zapisanym wyniku.";
}

export function historyEmptyText(canWriteResults: boolean): string {
  return canWriteResults
    ? "Tu pojawią się zapisane wyniki. Każdy z nich można później cofnąć albo poprawić."
    : "Nie ma jeszcze zapisanych wyników.";
}

export function queueEmptyText(input: { status: string | null | undefined; filtered: boolean }): string {
  if (input.filtered) return "Brak meczów w tym stanie.";
  if (input.status === "completed") return "Wszystkie mecze rozegrane — turniej jest zakończony.";
  return "Brak meczów do rozegrania. Następny krok pokazuje „Co teraz?”.";
}
