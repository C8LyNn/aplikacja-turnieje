/**
 * Pack 06 — conservative, pure progression preflight.
 * This is NEVER permission to mutate. Existing lifecycle and qualification
 * endpoints remain authoritative and must recheck database state at execution.
 */
import type { OperationsInput, OperationsSnapshot } from "./tournament-operations";

export type ProgressionKind = "start_stage" | "complete_stage" | "swiss_next_round" | "review" | "none";
export type PreflightAvailability = "ready_for_review" | "blocked" | "not_applicable";
export type CheckStatus = "pass" | "block" | "review";
export interface ProgressionCheck {
  code: string;
  status: CheckStatus;
  message: string;
}
export interface ProgressionEffect {
  code: string;
  confidence: "derived" | "conditional";
  message: string;
}
export interface TournamentProgressionPreflight {
  version: 1;
  advisory: true;
  tournamentId: number;
  kind: ProgressionKind;
  availability: PreflightAvailability;
  stageId: number | null;
  stageName: string | null;
  title: string;
  description: string;
  checks: ProgressionCheck[];
  effects: ProgressionEffect[];
  blockers: number;
  requiresConfirmation: boolean;
  /** Snapshot has no locking. Never reuse as an execution authorization. */
  executionMustRevalidate: true;
}

export function deriveTournamentProgressionPreflight(
  input: OperationsInput,
  operations: OperationsSnapshot,
): TournamentProgressionPreflight {
  const sorted = [...input.stages].sort((a, b) => a.position - b.position);
  const active = sorted.filter(stage => stage.status === "active");
  const planned = sorted.find(stage => stage.status === "planned");
  const op = operations.recommendedAction;
  const check: ProgressionCheck[] = [];
  const effect: ProgressionEffect[] = [];
  const addCheck = (code: string, status: CheckStatus, message: string) => {
    check.push({code, status, message});
  };
  const addEffect = (code: string, message: string, confidence: ProgressionEffect["confidence"] = "conditional") => {
    effect.push({code, message, confidence});
  };
  const activeCandidate = active.length === 1 ? active[0] : null;
  const selected = activeCandidate ?? planned ?? null;
  const create = (kind: ProgressionKind, title: string, description: string): TournamentProgressionPreflight => {
    const blockers = check.filter(item => item.status === "block").length;
    return {
      version: 1, advisory: true, tournamentId: input.tournament.id, kind,
      availability: kind === "none" ? "not_applicable" : blockers ? "blocked" : "ready_for_review",
      stageId: selected?.id ?? null, stageName: selected?.name ?? null,
      title, description, checks: check, effects: effect, blockers,
      requiresConfirmation: kind === "start_stage" || kind === "complete_stage" || kind === "swiss_next_round",
      executionMustRevalidate: true,
    };
  };

  // Independently detect contradictions before trusting even advisory data.
  if (active.length > 1) {
    addCheck("MULTIPLE_ACTIVE_STAGES", "block", "Jednocześnie aktywnych jest kilka etapów.");
    return create("review", "Wymagana kontrola spójności", "Przed kolejną operacją wyjaśnij statusy etapów.");
  }
  if (input.tournament.status === "completed") {
    addCheck("TOURNAMENT_COMPLETED", "pass", "Turniej jest już zakończony.");
    return create("none", "Brak kolejnych etapów", "Można przeglądać klasyfikację i archiwum.");
  }
  if (input.tournament.status === "draft" && activeCandidate) {
    addCheck("DRAFT_ACTIVE_INCONSISTENCY", "block", "Szkic zawiera aktywny etap.");
    return create("review", "Niespójny status turnieju", "Zweryfikuj dane przed dalszym prowadzeniem.");
  }
  if (sorted.length === 0) {
    addCheck("MISSING_STAGES", "block", "Nie znaleziono skonfigurowanych etapów.");
    return create("review", "Brak planu etapów", "Najpierw sprawdź konfigurację turnieju.");
  }
  if (!selected) {
    addCheck("NO_STAGE_TO_PROCESS", "block", "Nie ma etapu aktywnego ani planowanego.");
    return create("review", "Zweryfikuj status turnieju", "Brak jednoznacznego kolejnego kroku.");
  }

  if (!activeCandidate && planned) {
    const earlier = sorted.filter(stage => stage.position < planned.position);
    const uncompleted = earlier.filter(stage => stage.status !== "completed");
    addCheck("PREVIOUS_STAGES_COMPLETE", uncompleted.length ? "block" : "pass",
      uncompleted.length ? `${uncompleted.length} wcześniejszych etapów nie zostało zakończonych.` : "Wcześniejsze etapy są zakończone.");
    const readiness = input.plannedStageReadiness;
    if (!readiness) {
      addCheck("READINESS_UNAVAILABLE", "block", "Brak aktualnego potwierdzenia gotowości planowanego etapu.");
    } else {
      addCheck(readiness.reasonCode, readiness.ready ? "pass" : "block", readiness.message);
    }
    if (input.tournament.status === "draft" && input.players.length < 2) {
      addCheck("INSUFFICIENT_PARTICIPANTS", "block", "Przed startem dodaj co najmniej dwóch uczestników.");
    }
    addEffect("STAGE_ACTIVATION", `Po zatwierdzeniu może rozpocząć się etap „${planned.name}”.`);
    addEffect("MATCH_GENERATION", "Silnik etapu może wygenerować pary, rundę lub harmonogram. Dokładny wynik powstaje dopiero podczas operacji.");
    addEffect("ROSTER_AND_SEEDING", "Przed startem sprawdź listę uczestników i rozstawienie.");
    return create("start_stage", "Podgląd rozpoczęcia etapu", "Warunki startu są oceniane na podstawie aktualnego stanu; uruchomienie wymaga osobnego zatwierdzenia.");
  }

  if (!activeCandidate) {
    addCheck("NO_ACTIVE_STAGE", "block", "Nie udało się wskazać aktywnego etapu.");
    return create("review", "Sprawdź stan turnieju", "Konieczna jest weryfikacja etapów.");
  }

  const matches = input.matches.filter(m => m.stageId === activeCandidate.id);
  const counts = {
    pending: matches.filter(m => m.status === "pending").length,
    inProgress: matches.filter(m => m.status === "in_progress").length,
    postponed: matches.filter(m => m.status === "postponed").length,
    cancelled: matches.filter(m => m.status === "cancelled").length,
    completed: matches.filter(m => m.status === "completed").length,
  };
  addCheck("MATCHES_EXIST", matches.length ? "pass" : "block",
    matches.length ? `W etapie istnieje ${matches.length} zapisanych meczów.` : "Brak zapisanych meczów dla aktywnego etapu.");
  const unresolved = counts.pending + counts.inProgress + counts.postponed + counts.cancelled;
  addCheck("ALL_MATCHES_RESOLVED", unresolved ? "block" : "pass",
    unresolved
      ? `Nierozliczone: ${counts.pending} oczekujących, ${counts.inProgress} w toku, ${counts.postponed} przełożonych, ${counts.cancelled} anulowanych.`
      : "Wszystkie zapisane mecze etapu mają status zakończony.");
  if (op.availability === "blocked") {
    addCheck("OPERATIONS_BLOCKED", "block", `Centralny silnik operacyjny zgłasza blokadę: ${op.title}.`);
  }
  if (activeCandidate.format === "swiss") {
    const round = activeCandidate.currentRound ?? input.tournament.currentRound;
    const totalRounds = activeCandidate.plannedRounds ?? activeCandidate.totalRounds ?? input.tournament.totalRounds;
    if (!round || !totalRounds || round < 1 || totalRounds < 1) {
      addCheck("SWISS_ROUNDS_UNKNOWN", "block", "Nie udało się potwierdzić numeru rundy lub limitu rund Swiss.");
    } else if (round < totalRounds) {
      const roundMatches = matches.filter(m => m.round === round);
      addCheck("SWISS_CURRENT_ROUND", roundMatches.length && roundMatches.every(m => m.status === "completed") ? "pass" : "block",
        roundMatches.length && roundMatches.every(m => m.status === "completed")
          ? `Runda ${round} jest zakończona.` : `Runda ${round} nie ma kompletu rozliczonych meczów.`);
      addEffect("SWISS_NEW_PAIRINGS", `Po zatwierdzeniu silnik może przygotować pary rundy ${round + 1}.`);
      addEffect("PAIRING_RULES", "Powtórki, wolne losy i dobór par wymagają walidacji w operacji generowania rundy.");
      return create("swiss_next_round", "Podgląd kolejnej rundy Swiss", "Nowa runda nie jest generowana przez podgląd.");
    }
  }

  if (planned) {
    addEffect("NEXT_STAGE_STILL_PLANNED", `Po zamknięciu etapu „${activeCandidate.name}” następny etap „${planned.name}” pozostaje planowany; kwalifikacja i routing mogą wymagać oddzielnego zatwierdzenia.`);
  } else {
    addEffect("FINAL_STAGE", "Zamknięcie końcowego etapu może doprowadzić do zakończenia turnieju, o ile spełnione są reguły domenowe.");
  }
  addEffect("RANKING_RECALCULATION", "Operacja zakończenia etapu oblicza i zatwierdza klasyfikację zgodnie z formatem.");
  addEffect("QUALIFICATION_VERIFICATION", "Podgląd nie oblicza listy awansujących. Przed zatwierdzeniem sprawdź odpowiedni podgląd kwalifikacji i koszyki.");
  // No claims about automatic downstream propagation. Human acceptance is mandatory.
  addCheck("AUTHORITATIVE_COMPLETION", "review", "Ostateczną gotowość rozstrzyga transakcyjna operacja zakończenia etapu.");
  return create("complete_stage", "Podgląd zakończenia etapu", "Zamknięcie etapu wymaga weryfikacji klasyfikacji i osobnego zatwierdzenia.");
}
