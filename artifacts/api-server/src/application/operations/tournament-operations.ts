/**
 * Read-only, advisory operations snapshot for the organizer.
 * Domain decisions are pure: no writes, network calls, or database imports.
 * Mutation endpoints remain the final authority on execution readiness.
 */
export type TournamentPhase = "draft" | "active" | "completed";
export type StagePhase = "planned" | "active" | "completed";
export type MatchPhase = "pending" | "in_progress" | "postponed" | "completed" | "cancelled";
export type TournamentOperationCode =
  | "ADD_PARTICIPANTS" | "REVIEW_STAGE_PLAN" | "REVIEW_STAGE_READINESS"
  | "START_STAGE" | "RECORD_MATCH_RESULTS" | "REVIEW_POSTPONED_MATCHES"
  | "REVIEW_CANCELLED_MATCHES" | "REVIEW_STAGE_MATCHES"
  | "GENERATE_SWISS_ROUND" | "COMPLETE_STAGE" | "REVIEW_STAGE_TRANSITION"
  | "REVIEW_TOURNAMENT_STATE" | "VIEW_RESULTS";

export interface OperationsInput {
  tournament: {
    id: number;
    status: TournamentPhase;
    format: string;
    currentRound: number | null;
    totalRounds: number | null;
    activeStageId?: number | null;
  };
  players: readonly { id: number; seed?: number | null }[];
  stages: readonly {
    id: number;
    position: number;
    status: StagePhase;
    format: string;
    name: string;
    currentRound: number | null;
    totalRounds: number | null;
    plannedRounds?: number | null;
  }[];
  matches: readonly {
    id: number;
    stageId: number | null;
    round: number;
    status: MatchPhase;
  }[];
  /** Must be computed by authoritative stage readiness; never guessed here. */
  plannedStageReadiness?: {
    ready: boolean;
    reasonCode: string;
    message: string;
  } | null;
}

export interface OperationsAction {
  code: TournamentOperationCode;
  title: string;
  description: string;
  /** Read-only navigation hint; never an automatic mutation. */
  href: string;
  stageId: number | null;
  requiresConfirmation: boolean;
  /** 'review' means a human must verify the state before taking action. */
  availability: "ready" | "review" | "blocked";
}
export interface OperationsBlocker {
  code: string;
  message: string;
  stageId: number | null;
  severity: "blocking" | "warning";
}
export interface OperationsSnapshot {
  version: 1;
  tournamentId: number;
  phase: TournamentPhase;
  currentStageId: number | null;
  progress: {
    completed: number;
    total: number;
    inProgress: number;
    pending: number;
    postponed: number;
    cancelled: number;
    percent: number | null;
  };
  recommendedAction: OperationsAction;
  blockers: OperationsBlocker[];
  /** Advisory snapshot only; execution must recheck state and permissions. */
  advisory: true;
}

export function deriveTournamentOperations(input: OperationsInput): OperationsSnapshot {
  const tournament = input.tournament;
  const id = tournament.id;
  const stages = [...input.stages].sort((a, b) => a.position - b.position);
  const activeStages = stages.filter(s => s.status === "active");
  const active = activeStages.length === 1 ? activeStages[0] : null;
  const planned = stages.find(s => s.status === "planned") ?? null;
  const focus = active ?? planned;
  // Do not count completed matches from earlier stages as work left in the active stage.
  const focusMatches = focus ? input.matches.filter(m => m.stageId === focus.id) : [];
  const count = (status: MatchPhase) => focusMatches.filter(m => m.status === status).length;
  const completed = count("completed");
  const inProgress = count("in_progress");
  const pending = count("pending");
  const postponed = count("postponed");
  const cancelled = count("cancelled");
  const total = focusMatches.length;
  const progress = { completed, total, inProgress, pending, postponed, cancelled,
    percent: total === 0 ? null : Math.round(100 * completed / total) };
  const blockers: OperationsBlocker[] = [];
  const href = (stageId?: number | null, suffix = "") =>
    `/tournaments/${id}?tab=stages${stageId != null ? `&stage=${stageId}` : ""}${suffix}`;
  const action = (code: TournamentOperationCode, title: string, description: string,
    availability: OperationsAction["availability"], stageId: number | null = focus?.id ?? null,
    confirmation = false, target = href(stageId)):
    OperationsAction => ({code, title, description, availability, stageId,
      href: target, requiresConfirmation: confirmation});
  const issue = (code: string, message: string, stageId: number | null = focus?.id ?? null,
    severity: OperationsBlocker["severity"] = "blocking") => {
    blockers.push({code, message, stageId, severity});
  };
  let recommendation: OperationsAction;

  if (tournament.status === "completed") {
    recommendation = action("VIEW_RESULTS", "Turniej zakończony",
      "Sprawdź końcową klasyfikację i udostępnij wyniki.", "ready", null, false,
      `/tournaments/${id}?tab=standings`);
  } else if (stages.length === 0) {
    issue("STAGE_PLAN_MISSING", "Nie znaleziono planu etapów turnieju.", null);
    recommendation = action("REVIEW_STAGE_PLAN", "Sprawdź plan etapów",
      "Przed dalszymi działaniami zweryfikuj konfigurację turnieju.", "blocked", null);
  } else if (activeStages.length > 1) {
    issue("MULTIPLE_ACTIVE_STAGES", "Wykryto kilka równocześnie aktywnych etapów.", null);
    recommendation = action("REVIEW_TOURNAMENT_STATE", "Zweryfikuj stan etapów",
      "Turniej wymaga sprawdzenia przed dalszym prowadzeniem.", "blocked", null);
  } else if (tournament.status === "draft" && input.players.length < 2) {
    const missing = 2 - input.players.length;
    issue("NOT_ENOUGH_PARTICIPANTS", `Dodaj jeszcze ${missing} uczestników.`, planned?.id ?? null);
    recommendation = action("ADD_PARTICIPANTS", "Dodaj uczestników",
      "Do rozpoczęcia turnieju wymaganych jest co najmniej dwóch uczestników.",
      "blocked", null, false, `/tournaments/${id}?tab=players`);
  } else if (tournament.status === "draft" && active) {
    issue("DRAFT_HAS_ACTIVE_STAGE", "Etap działa, ale turniej jest oznaczony jako szkic.", active.id);
    recommendation = action("REVIEW_TOURNAMENT_STATE", "Sprawdź status turnieju",
      "Nie rozpoczynaj kolejnych operacji przed wyjaśnieniem niezgodności.", "blocked", active.id);
  } else if (tournament.status === "draft" || (tournament.status === "active" && !active && planned)) {
    const previous = planned && stages.find(s => s.position === planned.position - 1);
    const ready = input.plannedStageReadiness;
    if (previous && previous.status !== "completed") {
      issue("PREVIOUS_STAGE_INCOMPLETE", "Poprzedni etap nie jest jeszcze zakończony.", planned!.id);
      recommendation = action("REVIEW_STAGE_TRANSITION", "Sprawdź przejście między etapami",
        "Zakończ poprzedni etap, zanim rozpoczniesz następny.", "blocked", planned!.id);
    } else if (!ready) {
      issue("READINESS_NOT_VERIFIED", "Nie potwierdzono gotowości planowanego etapu.", planned?.id);
      recommendation = action("REVIEW_STAGE_READINESS", "Sprawdź gotowość etapu",
        "Otwórz konfigurację etapu i zweryfikuj uczestników, koszyki oraz zasady.",
        "review", planned?.id ?? null);
    } else if (!ready.ready) {
      issue(ready.reasonCode, ready.message, planned?.id);
      recommendation = action("REVIEW_STAGE_READINESS", "Usuń blokadę startu",
        ready.message, "blocked", planned?.id ?? null);
    } else {
      recommendation = action("START_STAGE", previous ? "Uruchom kolejny etap" : "Rozpocznij turniej",
        `Etap „${planned!.name}” jest gotowy. Sprawdź rozstawienie i zatwierdź start.`,
        "review", planned!.id, true);
    }
  } else if (tournament.status === "active" && active) {
    const stageId = active.id;
    const current = active.currentRound ?? tournament.currentRound ?? 1;
    const allRounds = active.plannedRounds ?? active.totalRounds ?? tournament.totalRounds ?? current;
    const roundMatches = focusMatches.filter(m => m.round === current);
    const earlierOpen = focusMatches.some(m => m.round < current && m.status !== "completed");
    if (total === 0) {
      issue("STAGE_MATCHES_MISSING", "Aktywny etap nie ma zapisanych meczów.", stageId);
      recommendation = action("REVIEW_STAGE_MATCHES", "Sprawdź mecze etapu",
        "Nie można potwierdzić kolejnego kroku bez listy meczów.", "blocked", stageId);
    } else if (cancelled > 0 || earlierOpen) {
      if (cancelled > 0) issue("CANCELLED_MATCHES_PENDING_REVIEW",
        `${cancelled} anulowanych meczów wymaga weryfikacji przed przejściem dalej.`, stageId);
      if (earlierOpen) issue("EARLIER_ROUND_INCOMPLETE",
        "Istnieją nierozliczone mecze z wcześniejszych rund.", stageId);
      recommendation = action("REVIEW_CANCELLED_MATCHES", "Sprawdź nierozliczone mecze",
        "Rozstrzygnij zaległe lub anulowane mecze, zanim zakończysz etap.", "blocked", stageId);
    } else if (inProgress > 0 || pending > 0) {
      recommendation = action("RECORD_MATCH_RESULTS", inProgress ? "Dokończ trwające mecze" : "Wprowadź wyniki meczów",
        `${inProgress + pending} meczów wymaga rozstrzygnięcia w aktywnym etapie.`, "ready", stageId,
        false, `/tournaments/${id}/host?tab=wyniki`);
    } else if (postponed > 0) {
      issue("POSTPONED_MATCHES", `${postponed} przełożonych meczów czeka na decyzję.`, stageId);
      recommendation = action("REVIEW_POSTPONED_MATCHES", "Rozpatrz przełożone mecze",
        "Przywróć mecze lub rozstrzygnij je zgodnie z regulaminem.", "review", stageId,
        false, `/tournaments/${id}/host?tab=wyniki`);
    } else if (active.format === "swiss" && current < allRounds) {
      if (roundMatches.length === 0 || roundMatches.some(m => m.status !== "completed")) {
        issue("SWISS_ROUND_NOT_READY", "Aktualna runda Swiss nie jest kompletna.", stageId);
        recommendation = action("REVIEW_STAGE_MATCHES", "Sprawdź rundę Swiss",
          "Przed generowaniem par potrzebne są wszystkie wyniki aktualnej rundy.", "blocked", stageId);
      } else {
        recommendation = action("GENERATE_SWISS_ROUND", "Wygeneruj następną rundę Swiss",
          `Runda ${current} jest kompletna. Zatwierdź wygenerowanie rundy ${current + 1}.`,
          "review", stageId, true);
      }
    } else {
      recommendation = action("COMPLETE_STAGE", "Sprawdź zakończenie etapu",
        `Wszystkie ${total} zapisane mecze etapu są rozliczone. Zatwierdź klasyfikację i zakończenie etapu.`,
        "review", stageId, true);
    }
  } else {
    issue("TOURNAMENT_STATE_REVIEW", "Nie ma aktywnego etapu ani etapu gotowego do uruchomienia.", null);
    recommendation = action("REVIEW_TOURNAMENT_STATE", "Zweryfikuj postęp turnieju",
      "Sprawdź, czy ostatni etap i status turnieju zostały prawidłowo zamknięte.", "review", null);
  }

  return {version: 1, tournamentId: id, phase: tournament.status,
    currentStageId: active?.id ?? null, progress, recommendedAction: recommendation,
    blockers, advisory: true};
}
